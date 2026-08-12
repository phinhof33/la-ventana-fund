import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import Link from "next/link";

const fundName = process.env.NEXT_PUBLIC_FUND_NAME || "La Ventana Fun Funds";

export default async function HomePage() {
  const supabase = createClient();
  const lang = getLang();
  const s = t(lang);

  const { data: balanceRow } = await supabase.from("fund_balance").select("balance").single();
  const balance = Number(balanceRow?.balance || 0);

  const { data: nominations } = await supabase
    .from("nominations")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <main>
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <p className="eyebrow">{s.home_eyebrow}</p>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.05, marginTop: 14, maxWidth: 640 }}>
          {s.home_headline_1}
          <br />
          {s.home_headline_2}
          <br />
          {s.home_headline_3}
        </h1>
        <p style={{ maxWidth: 480, marginTop: 20, color: "var(--parchment)", opacity: 0.85, fontSize: 17 }}>
          {s.home_blurb(fundName)}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <Link href="/login" className="btn btn-brass">
            {s.home_join(fundName)}
          </Link>
          <Link href="/catalog" className="btn btn-outline">
            {s.home_browse}
          </Link>
          <Link href="#ledger" className="btn btn-outline">
            {s.home_seeledger}
          </Link>
        </div>

        <svg
          viewBox="0 0 640 90"
          width="100%"
          style={{ maxWidth: 560, marginTop: 48, opacity: 0.8 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 66 C 120 40, 200 88, 320 58 S 520 20, 640 46" stroke="var(--teal)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M0 40 C 130 66, 210 10, 340 34 S 540 70, 640 20" stroke="var(--brass)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M560 20 L 600 4 L 596 26 Z" fill="var(--brass)" opacity="0.85" />
        </svg>
      </section>

      <section id="ledger" style={{ background: "var(--ink-raised)", padding: "48px 0" }}>
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontSize: 22 }}>{s.home_fundnow}</h2>
            <span className="mono" style={{ fontSize: 36, color: "var(--brass)" }}>
              ${balance.toFixed(2)}
            </span>
          </div>
          <Link href="/ledger" style={{ fontSize: 13, color: "var(--teal)" }}>
            {s.home_seeall}
          </Link>
          <hr className="hairline" style={{ margin: "20px 0" }} />
          <p className="eyebrow" style={{ marginBottom: 8 }}>{s.home_recentnoms}</p>
          {nominations && nominations.length > 0 ? (
            nominations.map((n) => (
              <div key={n.id} className="ledger-entry">
                <span>{n.title}</span>
                <span className="mono" style={{ opacity: 0.7, fontSize: 13, textTransform: "uppercase" }}>
                  {n.status}
                </span>
              </div>
            ))
          ) : (
            <p style={{ opacity: 0.7 }}>{s.home_nonoms}</p>
          )}
        </div>
      </section>

      <section className="wrap" style={{ padding: "56px 0" }}>
        <h2 style={{ fontSize: 22, marginBottom: 24 }}>{s.home_howitworks}</h2>
        <div className="ledger-entry">
          <span>{s.home_step1_title}</span>
          <span style={{ opacity: 0.7, maxWidth: 320, textAlign: "right" }}>{s.home_step1_body}</span>
        </div>
        <div className="ledger-entry">
          <span>{s.home_step2_title}</span>
          <span style={{ opacity: 0.7, maxWidth: 320, textAlign: "right" }}>{s.home_step2_body}</span>
        </div>
        <div className="ledger-entry">
          <span>{s.home_step3_title}</span>
          <span style={{ opacity: 0.7, maxWidth: 320, textAlign: "right" }}>{s.home_step3_body}</span>
        </div>
        <div className="ledger-entry" style={{ borderBottom: "none" }}>
          <span>{s.home_step4_title}</span>
          <span style={{ opacity: 0.7, maxWidth: 320, textAlign: "right" }}>{s.home_step4_body}</span>
        </div>
      </section>
    </main>
  );
}
