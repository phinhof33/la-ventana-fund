"use client";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { authCopy, readLangCookie, AuthLang } from "@/lib/authcopy";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<AuthLang>("en");

  useEffect(() => {
    setLang(readLangCookie());
  }, []);

  const s = authCopy[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError(s.tooShort);
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setBusy(false);
      return setError(s.resetNoSession);
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.href = "/vote";
  }

  return (
    <main className="wrap" style={{ paddingTop: 96, maxWidth: 420 }}>
      <h1 style={{ fontSize: 32 }}>{s.resetTitle}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="password" required minLength={8} placeholder={s.newPassword} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-brass" disabled={busy}>{s.resetButton}</button>
        {error && <p style={{ color: "var(--rust)", fontSize: 14 }}>{error}</p>}
      </form>
    </main>
  );
}
