import { createClient } from "@/lib/supabase/server";
import { nominateFromCatalog } from "@/app/dashboard/actions";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default async function CatalogPage() {
  const supabase = createClient();
  const lang = getLang();
  const s = t(lang);
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

  const { data: openNoms } = await supabase
    .from("nominations")
    .select("catalog_item_id")
    .eq("status", "open");
  const alreadyOpen = new Set((openNoms || []).map((n) => n.catalog_item_id).filter(Boolean));

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <p className="eyebrow">{s.catalog_eyebrow}</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>{s.catalog_title}</h1>
      <p style={{ opacity: 0.8, marginTop: 10, maxWidth: 520 }}>
        {s.catalog_blurb1}{" "}
        <Link href="/profile" style={{ color: "var(--teal)" }}>
          {s.catalog_blurb_link}
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
          const title = lang === "es" && item.title_es ? item.title_es : item.title;
          const description = lang === "es" && item.description_es ? item.description_es : item.description;
          const typeLabel = item.item_type === "event" ? s.catalog_type_event : s.catalog_type_equipment;
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
                  alt={title}
                  style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                />
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <h3 style={{ fontSize: 17 }}>{title}</h3>
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
                    {typeLabel}
                  </span>
                </div>
                {description && (
                  <p style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>{description}</p>
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
                      {s.catalog_signin}
                    </Link>
                  ) : !isActive ? (
                    <Link href="/profile" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>
                      {s.catalog_jointonominate}
                    </Link>
                  ) : isNominated ? (
                    <span className="mono" style={{ fontSize: 12, opacity: 0.6 }}>
                      {s.catalog_alreadynominated}
                    </span>
                  ) : (
                    <form action={nominateFromCatalog}>
                      <input type="hidden" name="catalog_item_id" value={item.id} />
                      <button type="submit" className="btn btn-brass" style={{ fontSize: 13, padding: "8px 14px" }}>
                        {s.catalog_nominatethis}
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
