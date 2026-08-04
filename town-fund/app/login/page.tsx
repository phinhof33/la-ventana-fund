"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <p className="eyebrow">Member sign in</p>
      <h1 style={{ fontSize: 32, marginTop: 12 }}>Get your link</h1>
      <p style={{ opacity: 0.8, marginTop: 12, fontSize: 15 }}>
        No password to remember. Enter your email and we'll send a one-time link to sign in.
      </p>
      {sent ? (
        <p style={{ marginTop: 32, color: "var(--teal)" }}>
          Check your inbox — a sign-in link is on its way to {email}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-brass">
            Send sign-in link
          </button>
          {error && <p style={{ color: "var(--rust)", fontSize: 14 }}>{error}</p>}
        </form>
      )}
    </main>
  );
}
