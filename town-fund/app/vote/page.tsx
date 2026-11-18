import { createClient } from "@/lib/supabase/server";
import { nominate, castVote } from "@/app/dashboard/actions";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { isMember } from "@/lib/membership";

export default async function VotePage() {
  const supabase = createClient();
  const lang = getLang();
  const s = t(lang);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isActive = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    isActive = isMember(data);
  }

  const { data: cycle } = await supabase
    .from("voting_cycles")
    .select("*")
    .eq("status", "open")
    .order("opens_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: nominations } = await supabase
    .from("nominations")
    .select("id, title, description, estimated_cost, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  let tally: Record<string, number> = {};
  let myVote: string | null = null;
  if (cycle) {
    const { data: tallyRows } = await supabase
      .from("current_tally")
      .select("nomination_id, vote_count")
      .eq("cycle_id", cycle.id);
    tallyRows?.forEach((r) => (tally[r.nomination_id] = r.vote_count));

    if (user) {
      const { data: myVoteRow } = await supabase
        .from("votes")
        .select("nomination_id")
        .eq("cycle_id", cycle.id)
        .eq("member_id", user.id)
        .maybeSingle();
      myVote = myVoteRow?.nomination_id || null;
    }
  }

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
      {/* ---------- VOTE SECTION ---------- */}
      <p className="eyebrow">{s.ledger_thismonth}</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>{s.ledger_vote}</h1>

      {user && isActive && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>{s.ledger_nominate_title}</h2>
          <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 16 }}>{s.ledger_nominate_blurb}</p>
          <form
            action={nominate}
            style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}
          >
            <input name="title" placeholder={s.ledger_nominate_placeholder} required />
            <textarea name="description" placeholder={s.ledger_nominate_desc_placeholder} rows={3} />
            <input name="estimated_cost" type="number" step="0.01" placeholder={s.ledger_nominate_cost_placeholder} />
            <button type="submit" className="btn btn-outline" style={{ alignSelf: "flex-start" }}>
              {s.ledger_submitnomination}
            </button>
          </form>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {cycle ? (
            <span className="eyebrow">
              {s.ledger_roundcloses(new Date(cycle.closes_at).toLocaleDateString(lang === "es" ? "es-MX" : undefined))}
            </span>
          ) : (
            <span className="eyebrow">{s.ledger_noopenround}</span>
          )}
        </div>
        {!cycle && <p style={{ opacity: 0.7, marginTop: 12 }}>{s.ledger_noopenround_blurb}</p>}
        {cycle && nominations && nominations.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {nominations.map((n) => {
              const count = tally[n.id] || 0;
              const isMine = myVote === n.id;
              return (
                <div key={n.id} className="ledger-entry" style={{ alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    {n.description && (
                      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2, maxWidth: 420 }}>
                        {n.description}
                      </div>
                    )}
                    {n.estimated_cost && (
                      <div className="mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                        {s.ledger_estcost} ${Number(n.estimated_cost).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
                      {s.ledger_votecount(count)}
                    </div>
                    {user && isActive ? (
                      <form action={castVote}>
                        <input type="hidden" name="cycle_id" value={cycle.id} />
                        <input type="hidden" name="nomination_id" value={n.id} />
                        <button type="submit" className={isMine ? "btn btn-brass" : "btn btn-outline"}>
                          {isMine ? s.ledger_yourpick : s.ledger_voteforthis}
                        </button>
                      </form>
                    ) : (
                      <Link href={user ? "/profile" : "/login"} className="btn btn-outline">
                        {user ? s.ledger_jointovote : s.ledger_signintovote}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}
