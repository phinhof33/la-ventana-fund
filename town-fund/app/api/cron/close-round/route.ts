import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: cycle } = await supabase
    .from("voting_cycles")
    .select("*")
    .eq("status", "open")
    .order("opens_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cycle) {
    const { data: tallyRows } = await supabase
      .from("current_tally")
      .select("nomination_id, vote_count")
      .eq("cycle_id", cycle.id);

    let winnerId: string | null = null;

    if (tallyRows && tallyRows.length > 0) {
      const maxVotes = Math.max(...tallyRows.map((r: any) => r.vote_count));
const tied = tallyRows.filter((r: any) => r.vote_count === maxVotes);
      winnerId = tied[Math.floor(Math.random() * tied.length)].nomination_id;
    } else {
      const { data: openNoms } = await supabase
        .from("nominations")
        .select("id")
        .eq("status", "open");
      if (openNoms && openNoms.length > 0) {
        winnerId = openNoms[Math.floor(Math.random() * openNoms.length)].id;
      }
    }

    if (winnerId) {
      const { data: winner } = await supabase
        .from("nominations")
        .select("*")
        .eq("id", winnerId)
        .single();

      await supabase.from("nominations").update({ status: "winner" }).eq("id", winnerId);

      await supabase
        .from("voting_cycles")
        .update({ status: "closed", winner_nomination_id: winnerId })
        .eq("id", cycle.id);

      if (winner) {
        await supabase.from("fund_ledger").insert({
          kind: "purchase",
          amount: -(Number(winner.estimated_cost) || 0),
          nomination_id: winnerId,
          note: `Purchased: ${winner.title}`,
        });
      }
    } else {
      await supabase.from("voting_cycles").update({ status: "closed" }).eq("id", cycle.id);
    }
  }

  const opensAt = new Date();
  const closesAt = new Date(opensAt);
  closesAt.setDate(closesAt.getDate() + 30);

  await supabase.from("voting_cycles").insert({
    status: "open",
    opens_at: opensAt.toISOString(),
    closes_at: closesAt.toISOString(),
  });

  return NextResponse.json({ ok: true });
}
