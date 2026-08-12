export type Lang = "en" | "es";

export const dict = {
  en: {
    nav_ideaboard: "Idea board",
    nav_ledger: "Vote & ledger",
    nav_profile: "Profile",

    home_eyebrow: "Pesos pooled by the people of La Ventana",
    home_headline_1: "$5 a month.",
    home_headline_2: "One more good thing",
    home_headline_3: "on the malecón.",
    home_blurb: (fundName: string) =>
      `${fundName} is a pooled fund for La Ventana, run by whoever chips in. $5 a month, nominate something the pueblo needs, vote on what we buy next — benches, shade, a basketball hoop, whatever the town's asking for.`,
    home_join: (fundName: string) => `Join ${fundName}`,
    home_browse: "Browse the idea board",
    home_seeledger: "See the ledger",

    home_fundnow: "The fund, right now",
    home_seeall: "See every contribution and purchase →",
    home_recentnoms: "Recent nominations",
    home_nonoms: "No nominations yet — the first member to join gets to propose one.",

    home_howitworks: "How it works",
    home_step1_title: "01 — Chip in $5/month",
    home_step1_body: "Billed automatically, cancel anytime.",
    home_step2_title: "02 — Nominate something the pueblo needs",
    home_step2_body: "Shade at the launch, a hoop at the cancha, new library books — anything.",
    home_step3_title: "03 — Vote on your favorite",
    home_step3_body: "One vote per member, each round.",
    home_step4_title: "04 — We buy it",
    home_step4_body: "The winning nomination gets purchased and logged on the ledger.",

    login_eyebrow: "Member sign in",
    login_title: "Get your link",
    login_blurb: "No password to remember. Enter your email and we'll send a one-time link to sign in.",
    login_sent: (email: string) => `Check your inbox — a sign-in link is on its way to ${email}.`,
    login_placeholder: "you@email.com",
    login_button: "Send sign-in link",
  },
  es: {
    nav_ideaboard: "Tablero de ideas",
    nav_ledger: "Votar y balance",
    nav_profile: "Perfil",

    home_eyebrow: "Pesos reunidos por la gente de La Ventana",
    home_headline_1: "$5 al mes.",
    home_headline_2: "Una cosa buena más",
    home_headline_3: "en el malecón.",
    home_blurb: (fundName: string) =>
      `${fundName} es un fondo comunitario para La Ventana, administrado por quien aporte. $5 al mes, nomina algo que el pueblo necesite, vota qué compramos después — bancas, sombra, un aro de basquetbol, lo que el pueblo pida.`,
    home_join: (fundName: string) => `Únete a ${fundName}`,
    home_browse: "Ver el tablero de ideas",
    home_seeledger: "Ver el balance",

    home_fundnow: "El fondo, ahora mismo",
    home_seeall: "Ver cada aportación y compra →",
    home_recentnoms: "Nominaciones recientes",
    home_nonoms: "Aún no hay nominaciones — el primer miembro en unirse puede proponer una.",

    home_howitworks: "Cómo funciona",
    home_step1_title: "01 — Aporta $5 al mes",
    home_step1_body: "Se cobra automáticamente, cancela cuando quieras.",
    home_step2_title: "02 — Nomina algo que el pueblo necesite",
    home_step2_body: "Sombra en el lanzamiento, un aro en la cancha, libros nuevos — lo que sea.",
    home_step3_title: "03 — Vota por tu favorita",
    home_step3_body: "Un voto por miembro, cada ronda.",
    home_step4_title: "04 — Lo compramos",
    home_step4_body: "La nominación ganadora se compra y se registra en el balance.",

    login_eyebrow: "Acceso de miembros",
    login_title: "Recibe tu enlace",
    login_blurb: "Sin contraseña que recordar. Escribe tu correo y te enviaremos un enlace para entrar.",
    login_sent: (email: string) => `Revisa tu correo — un enlace de acceso va en camino a ${email}.`,
    login_placeholder: "tu@correo.com",
    login_button: "Enviar enlace de acceso",
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}
