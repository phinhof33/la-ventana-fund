import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { nominate, castVote, completeProfile } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    await supabase.from("profiles").insert({ id: user.id, email: user.email });
    ({ data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single());
  }

  const isActive = profile?.subscription_status === "active";
  const needsOnboarding = !profile?.first_name;

  const profileForm = (
    <form
      action={completeProfile}
      encType="multipart/form-data"
      style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <input name="first_name" defaultValue={profile?.first_name || ""} placeholder="First name" required style={{ flex: 2 }} />
        <input
          name="last_initial"
          defaultValue={profile?.last_initial || ""}
          placeholder="Last initial"
          maxLength={1}
          style={{ flex: 1 }}
        />
      </div>
      <label style={{ fontSize: 12, opacity: 0.7 }}>Profile picture (optional)</label>
      <input name="avatar" type="file" accept="image/*" />
      <button type="submit" className="btn btn-brass" style={{ alignSelf: "flex-start" }}>
        {needsOnboarding ? "Save and continue" : "Save changes"}
      </button>
    </form>
  );

  if (needsOnboarding) {
    return (
      <main className="wrap" style={{ paddingTop: 72, maxWidth: 420 }}>
        <p className="eyebrow">One quick step</p>
        <h1 style={{ fontSize: 28, marginTop: 10 }}>Welcome — set up your profile</h1>
        <p style={{ opacity: 0.8, marginTop: 10, fontSize: 15 }}>
          Add your first name and last initial (like "Maria G.") so people can recognize
          you on the ledger instead of seeing your email. A photo's optional.
        </p>
        <div style={{ marginTop: 28 }}>{profileForm}</div>
      </main>
    );
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
    .in("status", ["open", "winner"])
    .order("created_at", { ascending: false });

  let tally: Record<string, number> = {};
  let myVote: string | null = null;

  if (cycle) {
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
  }

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--ink-raised)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
              }}
            >
              {profile?.first_name?.[0] || "?"}
            </div>
          )}
          <div>
            <p className="eyebrow">Signed in as</p>
            <h1 style={{ fontSize: 22, marginTop: 2 }}>
              {profile?.first_name} {profile?.last_initial ? `${profile.last_initial}.` : ""}
            </h1>
          </div>
        </div>
        <span
          className="mono"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 3,
            border: "1px solid var(--hairline)",
            color: isActive ? "var(--teal)" : "var(--rust)",
          }}
        >
          {isActive ? "Active member" : "Not subscribed"}
        </span>
      </div>

      {isActive && (
        <form action="/api/stripe/portal" method="POST" style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>
            Manage subscription
          </button>
        </form>
      )}

      <details style={{ marginTop: 20, maxWidth: 420 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--teal)" }}>
          Edit name or photo
        </summary>
        <div style={{ marginTop: 12, padding: 16, background: "var(--ink-raised)", borderRadius: 4 }}>
          {profileForm}
        </div>
      </details>

      {!isActive && (
        <div style={{ marginTop: 28, padding: 20, background: "var(--ink-raised)", borderRadius: 4 }}>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Join for $5/month to nominate ideas and vote on what we buy.
          </p>
          <form action="/api/stripe/checkout" method="POST" style={{ marginTop: 14 }}>
            <button className="btn btn-brass" type="submit">
              Subscribe — $5/month
            </button>
          </form>
        </div>
      )}

      {isActive && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Nominate something</h2>
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

      <section style={{ marginTop: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontSize: 20 }}>Vote</h2>
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
                    {isActive ? (
                      <form action={castVote}>
                        <input type="hidden" name="cycle_id" value={cycle.id} />
                        <input type="hidden" name="nomination_id" value={n.id} />
                        <button
                          type="submit"
                          className={isMine ? "btn btn-brass" : "btn btn-outline"}
                        >
                          {isMine ? "Your pick" : "Vote for this"}
                        </button>
                      </form>
                    ) : (
                      <Link href="/dashboard" className="btn btn-outline">
                        Join to vote
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
