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
        <link rel="preconnect"
