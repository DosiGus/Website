import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../lib/apiAuth";
import { META_GRAPH_BASE } from "../../../../lib/meta/types";
import { decryptToken } from "../../../../lib/security/tokenEncryption";

/**
 * GET: Diagnose Meta/Instagram webhook configuration.
 * Checks app-level subscriptions, page subscriptions, and token validity.
 */
export async function GET(request: Request) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);

    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const hasWebhookVerifyToken = Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN);

    if (!metaAppId || !metaAppSecret) {
      return NextResponse.json({ error: "META_APP_ID or META_APP_SECRET missing" }, { status: 500 });
    }

    const appAccessToken = `${metaAppId}|${metaAppSecret}`;
    const results: Record<string, unknown> = {
      envCheck: {
        hasMetaAppId: true,
        hasMetaAppSecret: true,
        hasWebhookVerifyToken,
        hasMetaRedirectUri: Boolean(process.env.META_REDIRECT_URI),
        hasMetaLoginConfigId: Boolean(process.env.META_LOGIN_CONFIG_ID),
      },
    };

    // 1. Check app-level webhook subscriptions
    try {
      const subsResponse = await fetch(
        `${META_GRAPH_BASE}/${metaAppId}/subscriptions?access_token=${encodeURIComponent(appAccessToken)}`,
      );
      const subsData = await subsResponse.json();
      results.appSubscriptions = {
        httpStatus: subsResponse.status,
        ok: subsResponse.ok,
        data: subsData,
      };
    } catch (error) {
      results.appSubscriptions = { error: String(error) };
    }

    // 2. Get all integrations for this account
    const { data: integrations, error: intError } = await supabase
      .from("integrations")
      .select("id, page_id, instagram_id, instagram_username, account_name, status, access_token, updated_at")
      .eq("account_id", accountId)
      .eq("provider", "meta");

    if (intError) {
      results.integrations = { error: intError.message };
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
        };

        let accessToken: string | null = null;
        try {
          accessToken = decryptToken(integration.access_token);
        } catch (error) {
          pageCheck.tokenDebug = { error: error instanceof Error ? error.message : String(error) };
          pageChecks.push(pageCheck);
          continue;
        }

        if (!accessToken) {
          pageCheck.tokenDebug = { error: "token_missing" };
          pageChecks.push(pageCheck);
          continue;
        }

        // Check page subscribed_apps
        try {
          const pageSubsResponse = await fetch(
            `${META_GRAPH_BASE}/${integration.page_id}/subscribed_apps?access_token=${encodeURIComponent(accessToken)}`,
          );
          const pageSubsData = await pageSubsResponse.json();
          pageCheck.pageSubscriptions = {
            httpStatus: pageSubsResponse.status,
            ok: pageSubsResponse.ok,
            data: pageSubsData,
          };
        } catch (error) {
          pageCheck.pageSubscriptions = { error: String(error) };
        }

        // Debug the stored token
        try {
          const debugResponse = await fetch(
            `${META_GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`,
          );
          const debugData = await debugResponse.json();
          pageCheck.tokenDebug = {
            httpStatus: debugResponse.status,
            ok: debugResponse.ok,
            type: debugData?.data?.type,
            isValid: debugData?.data?.is_valid,
            expiresAt: debugData?.data?.expires_at,
            scopes: debugData?.data?.scopes,
            granularScopes: debugData?.data?.granular_scopes,
          };
        } catch (error) {
          pageCheck.tokenDebug = { error: String(error) };
        }

        // Test if page token can access the Instagram account
        if (integration.instagram_id) {
          try {
            const igCheckResponse = await fetch(
              `${META_GRAPH_BASE}/${integration.instagram_id}?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
            );
            const igCheckData = await igCheckResponse.json();
            pageCheck.instagramAccess = {
              httpStatus: igCheckResponse.status,
              ok: igCheckResponse.ok,
              data: igCheckData,
            };
          } catch (error) {
            pageCheck.instagramAccess = { error: String(error) };
          }
        }

        pageChecks.push(pageCheck);
      }
      results.pageChecks = pageChecks;
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}
