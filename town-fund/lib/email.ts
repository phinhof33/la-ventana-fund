// Sends a transactional email through Resend's HTTP API (no extra package needed).
// Needs RESEND_API_KEY in Vercel. EMAIL_FROM is optional.
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("sendEmail: RESEND_API_KEY is not set");
    return;
  }
  const from = process.env.EMAIL_FROM || "Collective Coffers <hola@collectivecoffers.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("sendEmail failed:", res.status, await res.text());
  } catch (err) {
    console.error("sendEmail error:", err);
  }
}

export function paymentFailedEmail(firstName: string | null | undefined, siteUrl: string) {
  const hi = firstName ? `Hi ${firstName},` : "Hi,";
  const hola = firstName ? `Hola ${firstName},` : "Hola,";
  const link = `${siteUrl}/profile`;
  const subject = "Your Collective Coffers payment didn't go through / Tu pago no se procesó";
  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;line-height:1.5;color:#222">
<p>${hi}</p>
<p>Your $5 monthly payment to Collective Coffers didn't go through. Card companies decline payments sometimes. An expired card is the usual reason.</p>
<p>To keep your vote this month, update your card here:</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#b8893b;color:#fff;text-decoration:none;border-radius:6px">Update my card</a></p>
<p>Stripe will try the payment again over the next few days.</p>
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
<p>${hola}</p>
<p>Tu pago mensual de $5 a Collective Coffers no se procesó. A veces los bancos rechazan pagos. Lo más común es una tarjeta vencida.</p>
<p>Para conservar tu voto este mes, actualiza tu tarjeta aquí:</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#b8893b;color:#fff;text-decoration:none;border-radius:6px">Actualizar mi tarjeta</a></p>
<p>Stripe volverá a intentar el cobro en los próximos días.</p>
</div>`;
  return { subject, html };
}
