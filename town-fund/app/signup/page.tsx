"use client";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { authCopy, readLangCookie, AuthLang } from "@/lib/authcopy";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
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
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/profile` },
    });
    setBusy(false);
    if (error) return setError(error.message);
    // If email confirmation is off in Supabase, a session comes back right away.
    if (data.session) {
      window.location.href = "/profile";
      return;
    }
    setSent(true);
  }

  return (
    <main className="wrap" style={{ paddingTop: 96, maxWidth: 420 }}>
      <p className="eyebrow">{s.signupEyebrow}</p>
      <h1 style={{ fontSize: 32, marginTop: 12 }}>{s.signupTitle}</h1>
      {sent ? (
        <p style={{ marginTop: 32, color: "var(--teal)" }}>{s.signupSent(email)}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" required placeholder={s.email} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={8} placeholder={s.password} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn btn-brass" disabled={busy}>{s.signupButton}</button>
          {error && <p style={{ color: "var(--rust)", fontSize: 14 }}>{error}</p>}
        </form>
      )}
      <p style={{ marginTop: 24, fontSize: 14 }}><a href="/login" style={{ color: "var(--teal)" }}>{s.haveAccount}</a></p>
    </main>
  );
}
