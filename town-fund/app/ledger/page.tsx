import { createClient } from "@/lib/supabase/server";
import { nominate, castVote } from "@/app/dashboard/actions";
import Link from "next/link";

export default async function LedgerPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isActive = false;
  let profile: any = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data;
    isActive = profile?.subscription_status === "active";
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
  if (cycle && user) {
    const { data: tallyRows } = await supabase
      .from("current_tally")
      .select("nomination_id, vote_count")
      .eq("cycle_id", cycle.id);
    tallyRows?.forEach((r) => (tally[r.nomination_id] = r.vote_count));

    const { data: myVoteRow } = await supabase
      .from("votes")
      .select("nomination_id")
      .eq("cycle_id", cycle.id)
      .eq("member_id", user.id)
      .maybeSingle();
    myVote = myVoteRow?.nomination_id || null;
  } else if (cycle) {
    const { data: tallyRows } = await supabase
      .from("current_tally")
      .select("nomination_id, vote_count")
      .eq("cycle_id", cycle.id);
    tallyRows?.forEach((r) => (tally[r.nomination_id] = r.vote_count));
  }

  const { data: entries } = await supabase
    .from("public_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
      {/* ---------- VOTE SECTION ---------- */}
      <p className="eyebrow">This month</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>Vote</h1>

      {user && isActive && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Nominate something</h2>
          <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 16 }}>
            What should the town buy next?
          </p>
          <form
            action={nominate}
            style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}
          >
            <input name="title" placeholder="e.g. New bench at Elm Park" required />
            <textarea name="description" placeholder="Why does the town need this? (optional)" rows={3} />
            <input name="estimated_cost" type="number" step="0.01" placeholder="Estimated cost in $ (optional)" />
            <button type="submit" className="btn btn-outline" style={{ alignSelf: "flex-start" }}>
              Submit nomination
            </button>
          </form>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {cycle ? (
            <span className="eyebrow">
              Round closes {new Date(cycle.closes_at).toLocaleDateString()}
            </span>
          ) : (
            <span className="eyebrow">No open round</span>
          )}
        </div>
        {!cycle && (
          <p style={{ opacity: 0.7, marginTop: 12 }}>
            There's no open voting round right now — check back once one starts.
          </p>
        )}
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
                        est. ${Number(n.estimated_cost).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
                      {count} vote{count === 1 ? "" : "s"}
                    </div>
                    {user && isActive ? (
                      <form action={castVote}>
                        <input type="hidden" name="cycle_id" value={cycle.id} />
                        <input type="hidden" name="nomination_id" value={n.id} />
                        <button type="submit" className={isMine ? "btn btn-brass" : "btn btn-outline"}>
                          {isMine ? "Your pick" : "Vote for this"}
                        </button>
                      </form>
                    ) : (
                      <Link href={user ? "/profile" : "/login"} className="btn btn-outline">
                        {user ? "Join to vote" : "Sign in to vote"}
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
      <p className="eyebrow" style={{ marginTop: 56 }}>Full transparency</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>The ledger</h1>
      <p style={{ opacity: 0.8, marginTop: 10, maxWidth: 520 }}>
        Every $5 that's come in, and everything that's been bought with it. Anyone can see
        this — you don't need to be a member.
      </p>
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
        <span style={{ fontSize: 15 }}>Current balance</span>
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
                ? `${e.member_name} chipped in`
                : e.kind === "purchase"
                ? `Bought: ${e.nomination_title || "an item"}`
                : e.note || "Adjustment";
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
                      {new Date(e.created_at).toLocaleDateString(undefined, {
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
          <p style={{ opacity: 0.7, marginTop: 20 }}>No entries yet — the first contribution will show up here.</p>
        )}
      </div>
    </main>
  );
}
