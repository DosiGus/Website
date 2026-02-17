import { Resend } from "resend";
import { logger } from "../logger";

type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    await logger.warn("system", "Email not configured; skipping send", {
      metadata: {
        hasApiKey: Boolean(apiKey),
        hasFrom: Boolean(from),
        to: input.to,
        subject: input.subject,
      },
    });
    return { success: false, error: "Email not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if ("error" in result && result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, id: result.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    await logger.error("system", `Email send failed: ${message}`, {
      metadata: { to: input.to, subject: input.subject },
    });
    return { success: false, error: message };
  }
}
