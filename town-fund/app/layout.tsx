import "./globals.css";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { LangToggle } from "./lang-toggle";

const fundName = process.env.NEXT_PUBLIC_FUND_NAME || "La Ventana Fun Funds";

export const metadata = {
  title: fundName,
  description: `${fundName} — a pooled fund for La Ventana, Baja California Sur. Members chip in $5/month, nominate what the pueblo needs, and vote on what we buy.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const labels = t(lang);

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              textDecoration: "none",
              lineHeight: 1.15,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 17 }}>Collective Coffers</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 400,
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--brass)",
              }}
            >
              La Ventana
            </span>
          </a>
          <div style={{ display: "flex", gap: 20, fontSize: 14, alignItems: "center" }}>
            <a href="/catalog" style={{ textDecoration: "none" }}>
              {labels.nav_ideaboard}
            </a>
            <a href="/ledger" style={{ textDecoration: "none" }}>
              {labels.nav_ledger}
            </a>
            <a href="/profile" style={{ textDecoration: "none" }}>
              {labels.nav_profile}
            </a>
            <LangToggle lang={lang} />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
