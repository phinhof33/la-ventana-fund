import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe needs the raw body to verify the webhook signature.
export const runtime = "nodejs";

async function findMemberIdByCustomer(supabase: any, customerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id as string | undefined;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature check failed: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      // Map Stripe's status to our simplified set.
      const status = ["active", "trialing"].includes(sub.status)
        ? "active"
        : sub.status === "past_due"
        ? "past_due"
        : "canceled";
      await supabase.from("profiles").update({ subscription_status: status }).eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("profiles")
        .update({ subscription_status: "canceled" })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const memberId = await findMemberIdByCustomer(supabase, customerId);
      const amount = (invoice.amount_paid || 0) / 100;

      // stripe_event_id has a unique constraint, so re-delivered webhooks won't double-count.
      await supabase.from("fund_ledger").insert({
        kind: "contribution",
        amount,
        member_id: memberId || null,
        stripe_event_id: event.id,
        note: `Monthly contribution — invoice ${invoice.id}`,
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
