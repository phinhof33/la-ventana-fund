import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { completeProfile } from "@/app/dashboard/actions";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) {
    await supabase.from("profiles").insert({ id: user.id, email: user.email });
    ({ data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single());
  }

  const isActive = profile?.subscription_status === "active";
  const needsOnboarding = !profile?.first_name;

  const profileForm = (
    <form
      action={completeProfile}
      encType="multipart/form-data"
      style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <input name="first_name" defaultValue={profile?.first_name || ""} placeholder="First name" required style={{ flex: 2 }} />
        <input
          name="last_initial"
          defaultValue={profile?.last_initial || ""}
          placeholder="Last initial"
          maxLength={1}
          style={{ flex: 1 }}
        />
      </div>
      <label style={{ fontSize: 12, opacity: 0.7 }}>Profile picture (optional)</label>
      <input name="avatar" type="file" accept="image/*" />
      <button type="submit" className="btn btn-brass" style={{ alignSelf: "flex-start" }}>
        {needsOnboarding ? "Save and continue" : "Save changes"}
      </button>
    </form>
  );

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 480 }}>
      <p className="eyebrow">{needsOnboarding ? "One quick step" : "Your profile"}</p>
      <h1 style={{ fontSize: 28, marginTop: 10 }}>
        {needsOnboarding ? "Welcome — set up your profile" : `${profile?.first_name} ${profile?.last_initial || ""}`}
      </h1>

      {needsOnboarding && (
        <p style={{ opacity: 0.8, marginTop: 10, fontSize: 15 }}>
          Add your first name and last initial (like "Maria G.") so people can recognize
          you on the ledger instead of seeing your email. A photo's optional.
        </p>
      )}

      <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 14 }}>
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--ink-raised)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
            }}
          >
            {profile?.first_name?.[0] || "?"}
          </div>
        )}
        <span
          className="mono"
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 20,
            border: "1px solid var(--hairline)",
            color: isActive ? "var(--teal)" : "var(--rust)",
          }}
        >
          {isActive ? "Active member" : "Not subscribed"}
        </span>
      </div>

      {isActive && (
        <form action="/api/stripe/portal" method="POST" style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn-outline" style={{
