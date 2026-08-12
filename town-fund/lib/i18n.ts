export type Lang = "en" | "es";

export const dict = {
  en: {
    nav_ideaboard: "Idea board",
    nav_ledger: "Vote & ledger",
    nav_profile: "Profile",
  },
  es: {
    nav_ideaboard: "Tablero de ideas",
    nav_ledger: "Votar y balance",
    nav_profile: "Perfil",
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}
