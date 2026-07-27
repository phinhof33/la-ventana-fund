import "./globals.css";

const fundName = process.env.NEXT_PUBLIC_FUND_NAME || "La Ventana Fun Funds";

export const metadata = {
  title: fundName,
  description: `${fundName} — a pooled fund for La Ventana, Baja California Sur. Members chip in $5/month, nominate what the pueblo needs, and vote on what we buy.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
          <a href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600, textDecoration: "none" }}>
            {fundName}
          </a>
          <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
            <a href="/catalog" style={{ textDecoration: "none" }}>
              Idea board
            </a>
            <a href="/ledger" style={{ textDecoration: "none" }}>
              Ledger
            </a>
            <a href="/dashboard" style={{ textDecoration: "none" }}>
              Dashboard
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
