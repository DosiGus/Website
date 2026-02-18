import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../lib/apiAuth";
import { META_GRAPH_BASE } from "../../../../lib/meta/types";
import { decryptToken } from "../../../../lib/security/tokenEncryption";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";

/**
 * GET: Diagnose Meta/Instagram webhook configuration.
 * Checks app-level subscriptions, page subscriptions, and token validity.
 */
export async function GET(request: Request) {
  try {
    const { accountId, supabase, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "admin")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(`meta_diagnose:${accountId}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;

    if (!metaAppId || !metaAppSecret) {
      return NextResponse.json({ error: "Meta config missing" }, { status: 500 });
    }

    const appAccessToken = `${metaAppId}|${metaAppSecret}`;
    const results: Record<string, unknown> = {};

    // 1. Check app-level webhook subscriptions
    try {
      const subsResponse = await fetch(
        `${META_GRAPH_BASE}/${metaAppId}/subscriptions?access_token=${encodeURIComponent(appAccessToken)}`,
      );
      results.appSubscriptions = {
        httpStatus: subsResponse.status,
        ok: subsResponse.ok,
      };
    } catch (error) {
      results.appSubscriptions = { ok: false, error: "request_failed" };
    }

    // 2. Get all integrations for this account
    const { data: integrations, error: intError } = await supabase
      .from("integrations")
      .select("id, page_id, instagram_id, instagram_username, account_name, status, access_token, updated_at")
      .eq("account_id", accountId)
      .eq("provider", "meta");

    if (intError) {
      results.integrations = { error: "load_failed" };
    } else {
      results.integrations = integrations?.map((i) => ({
        id: i.id,
        pageId: i.page_id,
        instagramId: i.instagram_id,
        instagramUsername: i.instagram_username,
        accountName: i.account_name,
        status: i.status,
        hasToken: Boolean(i.access_token),
        updatedAt: i.updated_at,
      }));

      // 3. For each integration, check page subscriptions and token validity
      const pageChecks: Record<string, unknown>[] = [];
      for (const integration of integrations ?? []) {
        if (!integration.page_id || !integration.access_token) continue;

        const pageCheck: Record<string, unknown> = {
          pageId: integration.page_id,
          instagramId: integration.instagram_id,
          pageSubscriptionsOk: false,
          tokenValid: null,
          tokenExpiresAt: null,
          instagramAccessOk: null,
        };

        let accessToken: string | null = null;
        try {
          accessToken = decryptToken(integration.access_token);
        } catch (error) {
          pageCheck.tokenValid = false;
          pageChecks.push(pageCheck);
          continue;
        }

        if (!accessToken) {
          pageCheck.tokenValid = false;
          pageChecks.push(pageCheck);
          continue;
        }

        // Check page subscribed_apps
        try {
          const pageSubsResponse = await fetch(
            `${META_GRAPH_BASE}/${integration.page_id}/subscribed_apps?access_token=${encodeURIComponent(accessToken)}`,
          );
          pageCheck.pageSubscriptionsOk = pageSubsResponse.ok;
        } catch (error) {
          pageCheck.pageSubscriptionsOk = false;
        }

        // Debug the stored token
        try {
          const debugResponse = await fetch(
            `${META_GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`,
          );
          const debugData = await debugResponse.json();
          pageCheck.tokenValid = Boolean(debugData?.data?.is_valid);
          pageCheck.tokenExpiresAt = debugData?.data?.expires_at ?? null;
        } catch (error) {
          pageCheck.tokenValid = null;
        }

        // Test if page token can access the Instagram account
        if (integration.instagram_id) {
          try {
            const igCheckResponse = await fetch(
              `${META_GRAPH_BASE}/${integration.instagram_id}?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
            );
            pageCheck.instagramAccessOk = igCheckResponse.ok;
          } catch (error) {
            pageCheck.instagramAccessOk = false;
          }
        }

        pageChecks.push(pageCheck);
      }
      results.pageChecks = pageChecks;
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}
