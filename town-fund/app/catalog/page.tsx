import { createClient } from "@/lib/supabase/server";
import { nominateFromCatalog } from "@/app/dashboard/actions";
import Link from "next/link";

export default async function CatalogPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isActive = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .maybeSingle();
    isActive = profile?.subscription_status === "active";
  }

  const { data: items } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  // Nominations already open, so we can show "already nominated" instead of a dead button.
  const { data: openNoms } = await supabase
    .from("nominations")
    .select("catalog_item_id")
    .eq("status", "open");
  const alreadyOpen = new Set((openNoms || []).map((n) => n.catalog_item_id).filter(Boolean));

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <p className="eyebrow">Idea board</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>Things we could buy</h1>
      <p style={{ opacity: 0.8, marginTop: 10, maxWidth: 520 }}>
        A running list to get the ball rolling. Tap "Nominate this" to send it straight into this
        month's round — or submit your own idea from the{" "}
        <Link href="/dashboard" style={{ color: "var(--teal)" }}>
          dashboard
        </Link>
        .
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginTop: 36,
        }}
      >
        {items?.map((item) => {
          const isNominated = alreadyOpen.has(item.id);
          return (
            <div
              key={item.id}
              style={{
                background: "var(--ink-raised)",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid var(--hairline)",
              }}
            >
              {item.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt={item.title}
                  style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                />
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <h3 style={{ fontSize: 17 }}>{item.title}</h3>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                      color: item.item_type === "event" ? "var(--rust)" : "var(--teal)",
                    }}
                  >
                    {item.item_type}
                  </span>
                </div>
                {item.description && (
                  <p style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>{item.description}</p>
                )}
                <p className="mono" style={{ fontSize: 15, color: "var(--brass)", marginTop: 10 }}>
                  ${Number(item.price_low).toFixed(0)}–${Number(item.price_high).toFixed(0)}
                </p>
                {item.note && (
                  <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6, fontStyle: "italic" }}>{item.note}</p>
                )}

                <div style={{ marginTop: 14 }}>
                  {!user ? (
                    <Link href="/login" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>
                      Sign in to nominate
                    </Link>
                  ) : !isActive ? (
                    <Link href="/dashboard" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>
                      Join to nominate
                    </Link>
                  ) : isNominated ? (
                    <span className="mono" style={{ fontSize: 12, opacity: 0.6 }}>
                      Already up for a vote this round
                    </span>
                  ) : (
                    <form action={nominateFromCatalog}>
                      <input type="hidden" name="catalog_item_id" value={item.id} />
                      <button type="submit" className="btn btn-brass" style={{ fontSize: 13, padding: "8px 14px" }}>
                        Nominate this
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
