type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type DeliveryChannel = "resend" | "webhook" | "none";

export async function sendEmail(payload: EmailPayload): Promise<DeliveryChannel> {
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;
  if (resendKey && resendFrom) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html
      })
    }).catch(() => null);

    if (response?.ok) {
      return "resend";
    }
  }

  const webhookEndpoint = process.env.RESET_EMAIL_ENDPOINT;
  if (webhookEndpoint) {
    const response = await fetch(webhookEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(() => null);
    if (response?.ok) {
      return "webhook";
    }
  }

  return "none";
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPasswordResetEmail(input: {
  token: string;
  resetUrl?: string;
  expiresMinutes?: number;
}): { subject: string; text: string; html: string } {
  const expiresMinutes = input.expiresMinutes ?? 30;
  const safeToken = escapeHtml(input.token);
  const safeUrl = input.resetUrl ? escapeHtml(input.resetUrl) : "";
  const subject = "FleetFlow password reset";
  const textLines = [
    "FleetFlow - Password Reset",
    "",
    `Use this token within ${expiresMinutes} minutes: ${input.token}`,
    input.resetUrl ? `Reset link: ${input.resetUrl}` : "",
    "",
    "If you did not request this, ignore this email."
  ].filter(Boolean);

  const html = `
  <div style="margin:0;padding:24px;background:#f5f7fb;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#121212;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e7eaf0;border-radius:12px;overflow:hidden;">
      <div style="padding:18px 24px;background:#111827;color:#ffffff;">
        <h1 style="margin:0;font-size:20px;line-height:1.3;">FleetFlow</h1>
        <p style="margin:6px 0 0 0;font-size:13px;color:#d1d5db;">Password Reset Request</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">
          You requested a password reset. Use this token within <strong>${expiresMinutes} minutes</strong>:
        </p>
        <div style="padding:14px 16px;border:1px dashed #f59e0b;border-radius:8px;background:#fff8e7;font-size:16px;font-weight:700;letter-spacing:0.04em;word-break:break-all;">
          ${safeToken}
        </div>
        ${
          safeUrl
            ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;">Or open this link: <a href="${safeUrl}" style="color:#0f766e;">Reset password</a></p>`
            : ""
        }
        <p style="margin:18px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
          If you did not request this, you can safely ignore this message.
        </p>
      </div>
    </div>
  </div>`;

  return {
    subject,
    text: textLines.join("\n"),
    html
  };
}
