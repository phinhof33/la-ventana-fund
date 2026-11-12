export type AuthLang = "en" | "es";

export function readLangCookie(): AuthLang {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return m?.[1] === "es" ? "es" : "en";
}

export const authCopy = {
  en: {
    email: "you@email.com",
    password: "Password (8+ characters)",
    newPassword: "New password (8+ characters)",
    loginEyebrow: "Member sign in",
    loginTitle: "Welcome back",
    loginButton: "Sign in",
    loginLinkFailed: "That link didn't finish signing you in. If you just confirmed your email, sign in with your password below.",
    noAccount: "New here? Create an account",
    forgot: "Forgot your password?",
    signupEyebrow: "Join the fund",
    signupTitle: "Create your account",
    signupButton: "Create account",
    signupSent: (e: string) => `Almost there — we sent a confirmation link to ${e}. Click it, then sign in.`,
    haveAccount: "Already a member? Sign in",
    forgotTitle: "Reset your password",
    forgotBlurb: "Enter your email and we'll send a reset link. Open it in this same browser.",
    forgotButton: "Send reset link",
    forgotSent: (e: string) => `If ${e} has an account, a reset link is on its way.`,
    resetTitle: "Choose a new password",
    resetButton: "Save password",
    resetNoSession: "This reset link has expired or was opened in a different browser. Request a new one.",
    tooShort: "Password must be at least 8 characters.",
  },
  es: {
    email: "tu@correo.com",
    password: "Contraseña (8+ caracteres)",
    newPassword: "Nueva contraseña (8+ caracteres)",
    loginEyebrow: "Acceso de miembros",
    loginTitle: "Bienvenido de nuevo",
    loginButton: "Entrar",
    loginLinkFailed: "Ese enlace no terminó de iniciar tu sesión. Si acabas de confirmar tu correo, entra con tu contraseña abajo.",
    noAccount: "¿Eres nuevo? Crea una cuenta",
    forgot: "¿Olvidaste tu contraseña?",
    signupEyebrow: "Únete al fondo",
    signupTitle: "Crea tu cuenta",
    signupButton: "Crear cuenta",
    signupSent: (e: string) => `Casi listo — enviamos un enlace de confirmación a ${e}. Haz clic y luego entra.`,
    haveAccount: "¿Ya eres miembro? Entra",
    forgotTitle: "Restablece tu contraseña",
    forgotBlurb: "Escribe tu correo y te enviaremos un enlace. Ábrelo en este mismo navegador.",
    forgotButton: "Enviar enlace",
    forgotSent: (e: string) => `Si ${e} tiene cuenta, el enlace va en camino.`,
    resetTitle: "Elige una nueva contraseña",
    resetButton: "Guardar contraseña",
    resetNoSession: "Este enlace expiró o se abrió en otro navegador. Pide uno nuevo.",
    tooShort: "La contraseña debe tener al menos 8 caracteres.",
  },
};
