import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";

export default async function LedgerPage() {
  const supabase = createClient();
  const lang = getLang();
  const s = t(lang);
  const { data: balanceRow } = await supabase.from("fund_balance").select("balance").single();
  const balance = Number(balanceRow?.balance || 0);

  const { data: entries } = await supabase
    .from("public_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
      {/* ---------- LEDGER SECTION ---------- */}
      <p className="eyebrow">{s.ledger_transparency}</p>
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
