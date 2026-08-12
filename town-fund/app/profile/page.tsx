import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { completeProfile } from "@/app/dashboard/actions";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";

export default async function ProfilePage() {
  const supabase = createClient();
  const lang = getLang();
  const s = t(lang);
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
        <input name="first_name" defaultValue={profile?.first_name || ""} placeholder={s.profile_firstname} required style={{ flex: 2 }} />
        <input
          name="last_initial"
          defaultValue={profile?.last_initial || ""}
          placeholder={s.profile_lastinitial}
          maxLength={1}
          style={{ flex: 1 }}
        />
      </div>
      <label style={{ fontSize: 12, opacity: 0.7 }}>{s.profile_photo}</label>
      <input name="avatar" type="file" accept="image/*" />
      <button type="submit" className="btn btn-brass" style={{ alignSelf: "flex-start" }}>
        {needsOnboarding ? s.profile_save_new : s.profile_save_edit}
      </button>
    </form>
  );

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 480 }}>
      <p className="eyebrow">{needsOnboarding ? s.profile_eyebrow_onboarding : s.profile_eyebrow_saved}</p>
      <h1 style={{ fontSize: 28, marginTop: 10 }}>
        {needsOnboarding ? s.profile_welcome : `${profile?.first_name} ${profile?.last_initial || ""}`}
      </h1>

      {needsOnboarding && (
        <p style={{ opacity: 0.8, marginTop: 10, fontSize: 15 }}>{s.profile_onboarding_blurb}</p>
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
          {isActive ? s.profile_active : s.profile_notsubscribed}
        </span>
      </div>

      {isActive && (
        <form action="/api/stripe/portal" method="POST" style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>
            {s.profile_manage}
          </button>
        </form>
      )}

      {!isActive && !needsOnboarding && (
        <div style={{ marginTop: 20, padding: 20, background: "var(--ink-raised)", borderRadius: 16 }}>
          <p style={{ margin: 0, opacity: 0.9 }}>{s.profile_joinblurb}</p>
          <form action="/api/stripe/checkout" method="POST" style={{ marginTop: 14 }}>
            <button className="btn btn-brass" type="submit">
              {s.profile_subscribe}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 28 }}>{profileForm}</div>
    </main>
  );
}
