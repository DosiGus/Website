import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../../lib/logger";
import { META_GRAPH_BASE } from "../../../../../lib/meta/types";

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

  for (const integration of candidates) {
    if (!integration.refresh_token || !integration.page_id) {
      skipped += 1;
      await reqLogger.warn("oauth", "Meta refresh skipped: missing token or page id", {
        metadata: { integrationId: integration.id },
      });
      continue;
    }

    try {
      const refreshResponse = await fetch(
        `${META_GRAPH_BASE}/oauth/access_token?` +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: metaAppId,
            client_secret: metaAppSecret,
            fb_exchange_token: integration.refresh_token,
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
        continue;
      }

      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("integrations")
        .update({
          access_token: pageMatch.access_token,
          refresh_token: nextUserToken,
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
        continue;
      }

      refreshed += 1;
    } catch (error) {
      failed += 1;
      await reqLogger.logError("oauth", error, "Meta token refresh failed", {
        metadata: { integrationId: integration.id },
      });
    }
  }

  return NextResponse.json({ refreshed, failed, skipped, total: candidates.length });
}
