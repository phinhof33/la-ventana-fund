"use client";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { authCopy, readLangCookie, AuthLang } from "@/lib/authcopy";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<AuthLang>("en");

  useEffect(() => {
    setLang(readLangCookie());
    if (window.location.search.includes("error=")) setError("link");
  }, []);

  const s = authCopy[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.href = "/ledger";
  }

  return (
    <main className="wrap" style={{ paddingTop: 96, maxWidth: 420 }}>
      <p className="eyebrow">{s.loginEyebrow}</p>
      <h1 style={{ fontSize: 32, marginTop: 12 }}>{s.loginTitle}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="email" required placeholder={s.email} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required placeholder={s.password} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-brass" disabled={busy}>{s.loginButton}</button>
        {error && <p style={{ color: "var(--rust)", fontSize: 14 }}>{error === "link" ? s.loginLinkFailed : error}</p>}
      </form>
      <p style={{ marginTop: 24, fontSize: 14 }}><a href="/signup" style={{ color: "var(--teal)" }}>{s.noAccount}</a></p>
      <p style={{ marginTop: 8, fontSize: 14 }}><a href="/forgot-password" style={{ color: "var(--teal)" }}>{s.forgot}</a></p>
    </main>
  );
}
