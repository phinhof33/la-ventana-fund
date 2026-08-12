"use client";
import { useRouter } from "next/navigation";
import { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();

  function toggle() {
    const next: Lang = lang === "en" ? "es" : "en";
    document.cookie = `lang=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-outline"
      style={{ fontSize: 13, padding: "6px 12px" }}
    >
      {lang === "en" ? "Español" : "English"}
    </button>
  );
}
