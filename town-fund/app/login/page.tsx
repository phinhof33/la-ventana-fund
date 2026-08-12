"use client";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { dict, Lang } from "@/lib/i18n";

function readLangCookie(): Lang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return match?.[1] === "es" ? "es" : "en";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(readLangCookie());
  }, []);

  const s = dict[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="wrap" style={{ paddingTop: 96, maxWidth: 420 }}>
      <p className="eyebrow">{s.login_eyebrow}</p>
      <h1 style={{ fontSize: 32, marginTop: 12 }}>{s.login_title}</h1>
      <p style={{ opacity: 0.8, marginTop: 12, fontSize: 15 }}>{s.login_blurb}</p>
      {sent ? (
        <p style={{ marginTop: 32, color: "var(--teal)" }}>{s.login_sent(email)}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            required
            placeholder={s.login_placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-brass">
            {s.login_button}
          </button>
          {error && <p style={{ color: "var(--rust)", fontSize: 14 }}>{error}</p>}
        </form>
      )}
    </main>
  );
}
