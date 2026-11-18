import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { recordCashPayment } from "./actions";

export const dynamic = "force-dynamic";

// Today's pesos-per-dollar rate, from the free Frankfurter API (European Central Bank rates).
async function getRate(): Promise<string> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN", { cache: "no-store" });
    const json = await res.json();
    const r = json?.rates?.MXN;
    return r ? Number(r).toFixed(2) : "";
  } catch {
    return "";
  }
}

export default async function CashPage({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/");

  const admin = createAdminClient();
  const { data: members } = await admin.from("profiles").select("id, first_name, last_initial, email, paid_through, subscription_status").order("first_name", { ascending: true });
  const rate = await getRate();

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 520 }}>
      <p className="eyebrow">Admin</p>
      <h1 style={{ fontSize: 30, marginTop: 10 }}>Record a cash payment</h1>
      <p style={{ opacity: 0.7, fontSize: 14 }}>The member needs an account first. They get nominate and vote access until their paid-through date.</p>

      {searchParams.ok && <p style={{ padding: 12, borderRadius: 10, background: "var(--ink-raised)", color: "var(--teal)" }}>✓ {searchParams.ok}</p>}
      {searchParams.error && <p style={{ padding: 12, borderRadius: 10, background: "var(--ink-raised)", color: "var(--rust)" }}>{searchParams.error}</p>}

      <form action={recordCashPayment} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <label>Member</label>
        <select name="member_id" required defaultValue="">
          <option value="" disabled>Choose a member…</option>
          {(members || []).map((m: any) => (
            <option key={m.id} value={m.id}>
              {(m.first_name ? `${m.first_name} ${m.last_initial || ""}` : "(no name)") + " — " + m.email + (m.paid_through ? ` · cash through ${m.paid_through}` : "") + (m.subscription_status === "active" ? " · card" : "")}
            </option>
          ))}
        </select>

        <label>Months covered</label>
        <input name="months" type="number" min={1} max={24} defaultValue={1} required />

        <label>Pesos received</label>
        <input name="pesos" type="number" min={1} step="0.01" defaultValue={100} required />

        <label>Exchange rate (pesos per 1 USD){rate ? " — today's rate filled in" : ""}</label>
        <input name="rate" type="number" min={1} step="0.0001" defaultValue={rate} placeholder="e.g. 18.50" required />

        <button type="submit" className="btn btn-brass" style={{ alignSelf: "flex-start", marginTop: 8 }}>Mark as paid</button>
      </form>
    </main>
  );
}
