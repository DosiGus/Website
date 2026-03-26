import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/email/resend";

/**
 * Supabase Auth Hook — send_email
 *
 * Supabase calls this endpoint whenever it needs to send an auth email
 * (signup confirmation, password reset, invite, magic link).
 * We intercept the call and send a branded Wesponde email via Resend instead,
 * replacing the default Supabase sender which lands in spam.
 *
 * Setup (Supabase Dashboard):
 *   Authentication → Hooks → send_email hook
 *   URL:    https://wesponde.com/api/auth/email-hook
 *   Secret: value of AUTH_EMAIL_HOOK_SECRET env var
 *
 * Supabase expects HTTP 200 on success. Any non-200 causes it to fall back
 * to the built-in email sender (safe degradation).
 */

// Maps Supabase email_action_type → verifyOtp type used in /auth/callback
const OTP_TYPE_MAP: Record<string, string> = {
  signup: "email",
  recovery: "recovery",
  invite: "invite",
  magic_link: "magiclink",
  email_change_new: "email_change",
  email_change_current: "email_change",
  reauthentication: "email",
};

type HookPayload = {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.AUTH_EMAIL_HOOK_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Derive the site origin from the Supabase redirect URL env var. */
function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ?? "https://wesponde.com";
  try {
    return new URL(raw).origin;
  } catch {
    return "https://wesponde.com";
  }
}

// ---------------------------------------------------------------------------
// Email HTML templates — inline styles required for email client compatibility
// Design: Wesponde light theme (#f6f9ff bg, #121624 header, #2450b2 accent)
// ---------------------------------------------------------------------------

function baseLayout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f9ff;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f4;overflow:hidden;">
        <tr>
          <td style="background-color:#121624;padding:22px 32px;">
            <span style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.3px;">Wesponde</span>
          </td>
        </tr>
        <tr><td style="padding:36px 32px 32px;">${bodyContent}</td></tr>
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #e8edf8;">
            <p style="margin:0;font-size:12px;color:#7485ad;line-height:1.5;">Wesponde · Instagram DM-Automatisierung für dein Business<br>Du erhältst diese E-Mail weil dein Konto diese Aktion ausgelöst hat.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#121624;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:-0.1px;margin:4px 0;">${label}</a>`;
}

function fallbackLink(href: string): string {
  return `<p style="margin:20px 0 0;font-size:12px;color:#7485ad;word-break:break-all;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br><a href="${href}" style="color:#2450b2;">${href}</a></p>`;
}

function buildSignupEmail(callbackUrl: string): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#171923;letter-spacing:-0.4px;">E-Mail bestätigen</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#3d4255;line-height:1.65;">Willkommen bei Wesponde! Klick auf den Button unten, um deine E-Mail-Adresse zu bestätigen und dein Konto zu aktivieren.</p>
    ${ctaButton(callbackUrl, "E-Mail bestätigen")}
    <p style="margin:24px 0 0;font-size:13px;color:#67718a;line-height:1.55;">Der Link ist 24 Stunden gültig. Falls du kein Konto bei Wesponde erstellt hast, kannst du diese E-Mail ignorieren.</p>
    ${fallbackLink(callbackUrl)}`;
  return { subject: "Bestätige deine E-Mail-Adresse — Wesponde", html: baseLayout(body) };
}

function buildRecoveryEmail(callbackUrl: string): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#171923;letter-spacing:-0.4px;">Passwort zurücksetzen</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#3d4255;line-height:1.65;">Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klick auf den Button, um ein neues Passwort zu vergeben.</p>
    ${ctaButton(callbackUrl, "Passwort zurücksetzen")}
    <p style="margin:24px 0 0;font-size:13px;color:#67718a;line-height:1.55;">Der Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren — dein Passwort bleibt unverändert.</p>
    ${fallbackLink(callbackUrl)}`;
  return { subject: "Passwort zurücksetzen — Wesponde", html: baseLayout(body) };
}

function buildInviteEmail(callbackUrl: string): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#171923;letter-spacing:-0.4px;">Du wurdest eingeladen</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#3d4255;line-height:1.65;">Du wurdest eingeladen, einem Wesponde-Account beizutreten. Klick auf den Button, um die Einladung anzunehmen und dein Passwort festzulegen.</p>
    ${ctaButton(callbackUrl, "Einladung annehmen")}
    <p style="margin:24px 0 0;font-size:13px;color:#67718a;line-height:1.55;">Der Link ist 24 Stunden gültig. Falls du diese Einladung nicht erwartet hast, kannst du sie ignorieren.</p>
    ${fallbackLink(callbackUrl)}`;
  return { subject: "Du wurdest zu Wesponde eingeladen", html: baseLayout(body) };
}

function buildMagicLinkEmail(callbackUrl: string): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#171923;letter-spacing:-0.4px;">Dein Login-Link</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#3d4255;line-height:1.65;">Klick auf den Button um dich bei Wesponde einzuloggen. Kein Passwort nötig.</p>
    ${ctaButton(callbackUrl, "Einloggen")}
    <p style="margin:24px 0 0;font-size:13px;color:#67718a;line-height:1.55;">Der Link ist 1 Stunde gültig und kann nur einmal verwendet werden. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
    ${fallbackLink(callbackUrl)}`;
  return { subject: "Dein Wesponde Login-Link", html: baseLayout(body) };
}

function buildEmailChangeEmail(callbackUrl: string): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#171923;letter-spacing:-0.4px;">Neue E-Mail-Adresse bestätigen</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#3d4255;line-height:1.65;">Klick auf den Button, um deine neue E-Mail-Adresse zu bestätigen und die Änderung abzuschließen.</p>
    ${ctaButton(callbackUrl, "E-Mail-Adresse bestätigen")}
    <p style="margin:24px 0 0;font-size:13px;color:#67718a;line-height:1.55;">Der Link ist 24 Stunden gültig. Falls du diese Änderung nicht beantragt hast, wende dich bitte an unseren Support.</p>
    ${fallbackLink(callbackUrl)}`;
  return { subject: "Bestätige deine neue E-Mail-Adresse — Wesponde", html: baseLayout(body) };
}

function buildTemplate(
  actionType: string,
  callbackUrl: string
): { subject: string; html: string } | null {
  switch (actionType) {
    case "signup":
    case "reauthentication":
      return buildSignupEmail(callbackUrl);
    case "recovery":
      return buildRecoveryEmail(callbackUrl);
    case "invite":
      return buildInviteEmail(callbackUrl);
    case "magic_link":
      return buildMagicLinkEmail(callbackUrl);
    case "email_change_new":
    case "email_change_current":
      return buildEmailChangeEmail(callbackUrl);
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: HookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user, email_data } = payload;

  if (!user?.email || !email_data?.token_hash || !email_data?.email_action_type) {
    // Malformed payload — return 200 so Supabase doesn't retry indefinitely
    console.error("[email-hook] Malformed payload", { email: user?.email, actionType: email_data?.email_action_type });
    return NextResponse.json({});
  }

  const otpType = OTP_TYPE_MAP[email_data.email_action_type];
  if (!otpType) {
    // Unknown action type — let Supabase fall back to default
    return NextResponse.json({});
  }

  const siteOrigin = getSiteOrigin();
  const callbackUrl = `${siteOrigin}/auth/callback?token_hash=${encodeURIComponent(email_data.token_hash)}&type=${otpType}`;
  const template = buildTemplate(email_data.email_action_type, callbackUrl);

  if (!template) {
    return NextResponse.json({});
  }

  const result = await sendEmail({ to: [user.email], subject: template.subject, html: template.html });

  if (!result.success) {
    // Log but still return 200: a non-200 causes Supabase to retry with its default sender,
    // which could result in a duplicate email. Better to fail silently here.
    console.error("[email-hook] Resend failed:", result.error, { email: user.email, actionType: email_data.email_action_type });
  }

  return NextResponse.json({});
}
