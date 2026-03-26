import { createSupabaseServerClient } from "../supabaseServerClient";
import { sendEmail } from "./resend";
import { logger } from "../logger";
import type { ExtractedVariables } from "../webhook/variableExtractor";

/**
 * Sends a new-reservation notification email to the account owner.
 * Fire-and-forget safe: all errors are caught and logged, never thrown.
 * The reservation is already saved before this runs — email failure is non-critical.
 */
export async function sendReservationNotification(
  accountId: string,
  variables: ExtractedVariables,
  reservationId: string
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();

    // Find account owner
    const { data: ownerMember, error: memberError } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner")
      .single();

    if (memberError || !ownerMember?.user_id) {
      await logger.warn("system", "Reservation notification: no owner found", {
        accountId,
        metadata: { reservationId, error: memberError?.message },
      });
      return;
    }

    // Get owner email from Supabase Auth
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(ownerMember.user_id);

    if (userError || !userData?.user?.email) {
      await logger.warn("system", "Reservation notification: owner email not found", {
        accountId,
        metadata: { reservationId, userId: ownerMember.user_id },
      });
      return;
    }

    const ownerEmail = userData.user.email;
    const { name, date, time, guestCount, phone, email, specialRequests } = variables;

    // Format date: 2026-03-25 → 25.03.2026
    let displayDate = date ?? "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
      const [y, m, d] = displayDate.split("-");
      displayDate = `${d}.${m}.${y}`;
    }

    const displayTime = time ? `${time} Uhr` : "";
    const subject = `Neue Reservierung: ${name ?? "Gast"}, ${displayDate} ${displayTime}`.trim();
    const dashboardUrl = "https://wesponde.com/app/reservations";

    const rows = [
      ["Gast", name ?? "—"],
      ["Datum", displayDate || "—"],
      ["Uhrzeit", displayTime || "—"],
      ["Personen", guestCount != null ? String(guestCount) : "—"],
      phone ? ["Telefon", phone] : null,
      email ? ["E-Mail", email] : null,
      specialRequests ? ["Notizen", specialRequests] : null,
    ]
      .filter((row): row is string[] => row !== null)
      .map(
        ([label, value]) =>
          `<tr>
            <td style="padding:8px 16px 8px 0;color:#67718a;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
            <td style="padding:8px 0;color:#171923;font-size:14px;font-weight:500;">${value}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9ff;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid rgba(42,78,167,0.12);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#121624;padding:28px 32px;">
            <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.6;">Wesponde</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:600;">Neue Reservierung</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#3d4255;font-size:15px;line-height:1.6;">
              Eine neue Reservierung ist eingegangen.
            </p>

            <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #edf1f8;">
              <tbody>${rows}</tbody>
            </table>

            <div style="margin-top:32px;">
              <a href="${dashboardUrl}"
                 style="display:inline-block;background:#121624;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
                Im Dashboard ansehen →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #edf1f8;">
            <p style="margin:0;color:#9aa3b8;font-size:12px;">
              Diese Email wurde automatisch von Wesponde verschickt.<br>
              Reservierungs-ID: ${reservationId}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `Neue Reservierung\n\nGast: ${name ?? "—"}\nDatum: ${displayDate || "—"}\nUhrzeit: ${displayTime || "—"}\nPersonen: ${guestCount ?? "—"}${phone ? `\nTelefon: ${phone}` : ""}${email ? `\nE-Mail: ${email}` : ""}${specialRequests ? `\nNotizen: ${specialRequests}` : ""}\n\nDashboard: ${dashboardUrl}\nReservierungs-ID: ${reservationId}`;

    await sendEmail({ to: [ownerEmail], subject, html, text });
  } catch (err) {
    // Never let notification errors affect the caller
    await logger.warn("system", "Reservation notification failed unexpectedly", {
      accountId,
      metadata: {
        reservationId,
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
