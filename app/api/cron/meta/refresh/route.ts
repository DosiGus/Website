import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../../lib/logger";
import { META_GRAPH_BASE } from "../../../../../lib/meta/types";
import { sendEmail } from "../../../../../lib/email/resend";
import { decryptToken, encryptToken, isEncryptedToken } from "../../../../../lib/security/tokenEncryption";

const REFRESH_LOOKAHEAD_DAYS = 10;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!cronSecret) return vercelCron;
  return authHeader === `Bearer ${cronSecret}` || vercelCron;
}

export async function GET(request: Request) {
  const reqLogger = createRequestLogger("oauth");

  if (!isAuthorized(request)) {
    await reqLogger.warn("oauth", "Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaAppId = process.env.META_APP_ID;
  const metaAppSecret = process.env.META_APP_SECRET;
  if (!metaAppId || !metaAppSecret) {
    await reqLogger.error("oauth", "Missing Meta OAuth environment variables", {
      metadata: { hasAppId: Boolean(metaAppId), hasAppSecret: Boolean(metaAppSecret) },
    });
    return NextResponse.json({ error: "Missing Meta config" }, { status: 500 });
  }

  const supabase = createSupabaseServerClient();
  const { data: integrations, error: integrationsError } = await supabase
    .from("integrations")
    .select("id,user_id,account_id,refresh_token,page_id,expires_at,account_name,instagram_id")
    .eq("provider", "meta")
    .eq("status", "connected");

  if (integrationsError) {
    await reqLogger.error("oauth", `Failed to load integrations: ${integrationsError.message}`);
    return NextResponse.json({ error: "Failed to load integrations" }, { status: 500 });
  }

  const now = Date.now();
  const cutoff = now + REFRESH_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000;
  const candidates = (integrations ?? []).filter((integration) => {
    if (!integration.expires_at) return true;
    return new Date(integration.expires_at).getTime() <= cutoff;
  });

  let refreshed = 0;
  let failed = 0;
  let skipped = 0;

  const issues: Array<{
    integrationId: string;
    accountId: string;
    accountName?: string | null;
    instagramId?: string | null;
    reason: string;
  }> = [];

  for (const integration of candidates) {
    if (!integration.refresh_token || !integration.page_id) {
      skipped += 1;
      await reqLogger.warn("oauth", "Meta refresh skipped: missing token or page id", {
        metadata: { integrationId: integration.id },
      });
      issues.push({
        integrationId: integration.id,
        accountId: integration.account_id,
        accountName: integration.account_name ?? null,
        instagramId: integration.instagram_id ?? null,
        reason: "Token oder Page-ID fehlt. Bitte Instagram neu verbinden.",
      });
      continue;
    }

    let decryptedRefreshToken: string | null = null;
    try {
      decryptedRefreshToken = decryptToken(integration.refresh_token);
    } catch (error) {
      await reqLogger.warn("oauth", "Meta refresh skipped: token decrypt failed", {
        metadata: {
          integrationId: integration.id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      issues.push({
        integrationId: integration.id,
        accountId: integration.account_id,
        accountName: integration.account_name ?? null,
        instagramId: integration.instagram_id ?? null,
        reason: "Token konnte nicht entschluesselt werden.",
      });
      skipped += 1;
      continue;
    }

    if (!decryptedRefreshToken) {
      skipped += 1;
      await reqLogger.warn("oauth", "Meta refresh skipped: refresh token missing after decrypt", {
        metadata: { integrationId: integration.id },
      });
      issues.push({
        integrationId: integration.id,
        accountId: integration.account_id,
        accountName: integration.account_name ?? null,
        instagramId: integration.instagram_id ?? null,
        reason: "Token fehlt oder konnte nicht entschluesselt werden.",
      });
      continue;
    }

    if (process.env.TOKEN_ENCRYPTION_KEY && !isEncryptedToken(integration.refresh_token)) {
      await supabase
        .from("integrations")
        .update({
          refresh_token: encryptToken(integration.refresh_token),
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);
    }

    try {
      const refreshResponse = await fetch(
        `${META_GRAPH_BASE}/oauth/access_token?` +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: metaAppId,
            client_secret: metaAppSecret,
            fb_exchange_token: decryptedRefreshToken,
          }),
      );

      const refreshBody = await refreshResponse.json();
      if (!refreshResponse.ok) {
        const errorCode =
          typeof refreshBody?.error?.code === "number" ? refreshBody.error.code : null;
        await reqLogger.warn("oauth", "Meta token refresh failed", {
          metadata: {
            integrationId: integration.id,
            error: refreshBody?.error ?? refreshBody,
          },
        });

        if (errorCode === 190) {
          await supabase
            .from("integrations")
            .update({
              status: "disconnected",
              access_token: null,
              refresh_token: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", integration.id);
        }

        failed += 1;
        issues.push({
          integrationId: integration.id,
          accountId: integration.account_id,
          accountName: integration.account_name ?? null,
          instagramId: integration.instagram_id ?? null,
          reason:
            errorCode === 190
              ? "Token abgelaufen. Bitte Instagram neu verbinden."
              : "Token-Refresh fehlgeschlagen. Bitte Verbindung prüfen.",
        });
        continue;
      }

      const nextUserToken = refreshBody?.access_token as string | undefined;
      const expiresInSeconds =
        typeof refreshBody?.expires_in === "number" && refreshBody.expires_in > 0
          ? refreshBody.expires_in
          : 60 * 24 * 60 * 60;

      if (!nextUserToken) {
        failed += 1;
        await reqLogger.warn("oauth", "Meta refresh returned no access token", {
          metadata: { integrationId: integration.id },
        });
        issues.push({
          integrationId: integration.id,
          accountId: integration.account_id,
          accountName: integration.account_name ?? null,
          instagramId: integration.instagram_id ?? null,
          reason: "Refresh lieferte keinen Token. Bitte Instagram neu verbinden.",
        });
        continue;
      }

      const pagesResponse = await fetch(
        `${META_GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(nextUserToken)}`,
      );
      const pagesBody = await pagesResponse.json();
      if (!pagesResponse.ok || !Array.isArray(pagesBody?.data)) {
        failed += 1;
        await reqLogger.warn("oauth", "Failed to fetch page tokens during refresh", {
          metadata: {
            integrationId: integration.id,
            error: pagesBody?.error ?? pagesBody,
          },
        });
        issues.push({
          integrationId: integration.id,
          accountId: integration.account_id,
          accountName: integration.account_name ?? null,
          instagramId: integration.instagram_id ?? null,
          reason: "Seiten-Token konnten nicht geladen werden. Bitte Instagram neu verbinden.",
        });
        continue;
      }

      const pageMatch =
        pagesBody.data.find((page: { id?: string }) => page.id === integration.page_id) ??
        pagesBody.data[0];

      if (!pageMatch?.access_token) {
        failed += 1;
        await reqLogger.warn("oauth", "No page access token available during refresh", {
          metadata: { integrationId: integration.id, pageId: integration.page_id },
        });
        issues.push({
          integrationId: integration.id,
          accountId: integration.account_id,
          accountName: integration.account_name ?? null,
          instagramId: integration.instagram_id ?? null,
          reason: "Page-Token fehlt. Bitte Instagram neu verbinden.",
        });
        continue;
      }

      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      const encryptedAccessToken = encryptToken(pageMatch.access_token);
      const encryptedUserToken = encryptToken(nextUserToken);

      const { error: updateError } = await supabase
        .from("integrations")
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedUserToken,
          expires_at: expiresAt,
          page_id: pageMatch.id ?? integration.page_id,
          account_name: pageMatch.name ?? integration.account_name,
          status: "connected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      if (updateError) {
        failed += 1;
        await reqLogger.error("oauth", `Failed to update integration: ${updateError.message}`, {
          metadata: { integrationId: integration.id },
        });
        issues.push({
          integrationId: integration.id,
          accountId: integration.account_id,
          accountName: integration.account_name ?? null,
          instagramId: integration.instagram_id ?? null,
          reason: "Token-Update fehlgeschlagen. Bitte Verbindung prüfen.",
        });
        continue;
      }

      refreshed += 1;
    } catch (error) {
      failed += 1;
      await reqLogger.logError("oauth", error, "Meta token refresh failed", {
        metadata: { integrationId: integration.id },
      });
      issues.push({
        integrationId: integration.id,
        accountId: integration.account_id,
        accountName: integration.account_name ?? null,
        instagramId: integration.instagram_id ?? null,
        reason: "Token-Refresh fehlgeschlagen. Bitte Verbindung prüfen.",
      });
    }
  }

  if (issues.length > 0) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const issueIds = Array.from(new Set(issues.map((issue) => issue.integrationId)));
    const { data: recentAlerts } = await supabase
      .from("integration_alerts")
      .select("integration_id")
      .in("integration_id", issueIds)
      .eq("alert_type", "meta_refresh_failed")
      .gte("sent_at", since);

    const alertedIds = new Set((recentAlerts ?? []).map((alert) => alert.integration_id));
    const pendingIssues = issues.filter((issue) => !alertedIds.has(issue.integrationId));

    const issuesByAccount = new Map<string, typeof pendingIssues>();
    for (const issue of pendingIssues) {
      const list = issuesByAccount.get(issue.accountId) ?? [];
      list.push(issue);
      issuesByAccount.set(issue.accountId, list);
    }

    for (const [accountId, accountIssues] of Array.from(issuesByAccount.entries())) {
      const { data: owners } = await supabase
        .from("account_members")
        .select("user_id")
        .eq("account_id", accountId)
        .eq("role", "owner");

      const ownerIds = (owners ?? []).map((owner) => owner.user_id);
      if (ownerIds.length === 0) continue;

      const { data: ownerUsers } = await supabase
        .schema("auth")
        .from("users")
        .select("id,email")
        .in("id", ownerIds);

      const recipients = (ownerUsers ?? [])
        .map((user) => user.email)
        .filter((email): email is string => Boolean(email));

      if (recipients.length === 0) continue;

      const listItems = accountIssues
        .map((issue) => {
          const label = issue.accountName || issue.instagramId || issue.integrationId;
          return `<li><strong>${label}</strong>: ${issue.reason}</li>`;
        })
        .join("");

      const subject = "Wesponde: Instagram Verbindung benötigt Aufmerksamkeit";
      const html = `
        <p>Hallo,</p>
        <p>bei deiner Instagram-Integration gab es ein Problem beim automatischen Token-Refresh:</p>
        <ul>${listItems}</ul>
        <p>Bitte verbinde Instagram in Wesponde neu, damit die Automatisierung weiterläuft.</p>
      `;

      const emailResult = await sendEmail({
        to: recipients,
        subject,
        html,
      });

      if (emailResult.success) {
        const rows = accountIssues.map((issue) => ({
          integration_id: issue.integrationId,
          account_id: issue.accountId,
          alert_type: "meta_refresh_failed",
          message: issue.reason,
        }));
        await supabase.from("integration_alerts").insert(rows);
      }
    }
  }

  return NextResponse.json({ refreshed, failed, skipped, total: candidates.length, issues: issues.length });
}
