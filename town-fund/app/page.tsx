import { createClient } from "@/lib/supabase/server";
import { nominate, castVote } from "@/app/dashboard/actions";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default async function LedgerPage() {
  const supabase = createClient();
  const lang = getLang();
  const s = t(lang);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isActive = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    isActive = data?.subscription_status === "active";
  }

  const { data: balanceRow } = await supabase.from("fund_balance").select("balance").single();
  const balance = Number(balanceRow?.balance || 0);

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

  const { data: entries } = await supabase
    .from("public_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

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

      {/* ---------- LEDGER SECTION ---------- */}
      <p className="eyebrow" style={{ marginTop: 56 }}>{s.ledger_transparency}</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>{s.ledger_title}</h1>
      <p style={{ opacity: 0.8, marginTop: 10, maxWidth: 520 }}>{s.ledger_blurb}</p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 32,
          padding: "20px 0",
          borderTop: "1px solid var(--hairline)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <span style={{ fontSize: 15 }}>{s.ledger_currentbalance}</span>
        <span className="mono" style={{ fontSize: 32, color: "var(--brass)" }}>
          ${balance.toFixed(2)}
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        {entries && entries.length > 0 ? (
          entries.map((e: any) => {
            const isIn = Number(e.amount) >= 0;
            const label =
              e.kind === "contribution"
                ? s.ledger_chippedin(e.member_name)
                : e.kind === "purchase"
                ? s.ledger_bought(e.nomination_title || s.ledger_anitem)
                : e.note || s.ledger_adjustment;
            return (
              <div key={e.id} className="ledger-entry" style={{ alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {e.kind === "contribution" &&
                    (e.member_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.member_avatar_url}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--ink)",
                          color: "var(--parchment)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                        }}
                      >
                        {e.member_name?.[0] || "?"}
                      </div>
                    ))}
                  <div>
                    <div>{label}</div>
                    <div className="mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      {new Date(e.created_at).toLocaleDateString(lang === "es" ? "es-MX" : undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 15, color: isIn ? "var(--teal)" : "var(--rust)", whiteSpace: "nowrap" }}
                >
                  {isIn ? "+" : "-"}${Math.abs(Number(e.amount)).toFixed(2)}
                </span>
              </div>
            );
          })
        ) : (
          <p style={{ opacity: 0.7, marginTop: 20 }}>{s.ledger_noentries}</p>
        )}
      </div>
    </main>
  );
}
