"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function recordCashPayment(formData: FormData) {
  // 1) Only admins may do this — checked on the server, every time.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/");

  // 2) Read and check the form
  const memberId = String(formData.get("member_id") || "");
  const months = Math.floor(Number(formData.get("months")));
  const pesos = Number(formData.get("pesos"));
  const rate = Number(formData.get("rate")); // pesos per 1 USD
  if (!memberId) redirect("/admin/cash?error=Pick+a+member");
  if (!(months >= 1 && months <= 24)) redirect("/admin/cash?error=Months+must+be+1-24");
  if (!(pesos > 0)) redirect("/admin/cash?error=Enter+the+pesos+received");
  if (!(rate > 0)) redirect("/admin/cash?error=Enter+the+exchange+rate");

  const usd = Math.round((pesos / rate) * 100) / 100;

  // 3) Extend their paid-through date (from today, or from their current date if still valid)
  const admin = createAdminClient();
  const { data: member } = await admin.from("profiles").select("first_name, last_initial, email, paid_through").eq("id", memberId).single();
  if (!member) redirect("/admin/cash?error=Member+not+found");

  const today = new Date().toISOString().slice(0, 10);
  const start = member.paid_through && member.paid_through >= today ? member.paid_through : today;
  const d = new Date(start + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  const paidThrough = d.toISOString().slice(0, 10);

  // 4) Record it in the public ledger (in USD, keeping the original pesos and rate)
  const { error: ledgerError } = await admin.from("fund_ledger").insert({
    kind: "contribution",
    amount: usd,
    member_id: memberId,
    original_amount: pesos,
    original_currency: "MXN",
    exchange_rate: rate,
    note: `Cash: ${pesos} MXN @ ${rate} = $${usd.toFixed(2)} USD (${months} mo)`,
  });
  if (ledgerError) redirect("/admin/cash?error=" + encodeURIComponent(ledgerError.message));

  const { error: profileError } = await admin.from("profiles").update({ paid_through: paidThrough }).eq("id", memberId);
  if (profileError) redirect("/admin/cash?error=" + encodeURIComponent(profileError.message));

  revalidatePath("/ledger");
  revalidatePath("/");
  const name = member.first_name ? `${member.first_name} ${member.last_initial || ""}`.trim() : member.email;
  const msg = `${name}: ${pesos} MXN = $${usd.toFixed(2)} USD. Member through ${paidThrough}.`;
  redirect("/admin/cash?ok=" + encodeURIComponent(msg));
}
