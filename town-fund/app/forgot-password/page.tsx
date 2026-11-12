"use client";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { authCopy, readLangCookie, AuthLang } from "@/lib/authcopy";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<AuthLang>("en");

  useEffect(() => {
    setLang(readLangCookie());
  }, []);

  const s = authCopy[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <main className="wrap" style={{ paddingTop: 96, maxWidth: 420 }}>
      <h1 style={{ fontSize: 32 }}>{s.forgotTitle}</h1>
      <p style={{ opacity: 0.8, marginTop: 12, fontSize: 15 }}>{s.forgotBlurb}</p>
      {sent ? (
        <p style={{ marginTop: 32, color: "var(--teal)" }}>{s.forgotSent(email)}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" required placeholder={s.email} value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn btn-brass">{s.forgotButton}</button>
          {error && <p style={{ color: "var(--rust)", fontSize: 14 }}>{error}</p>}
        </form>
      )}
    </main>
  );
}
