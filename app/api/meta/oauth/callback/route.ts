import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../../lib/logger";
import { randomUUID } from "crypto";
import {
  META_GRAPH_BASE,
  type MetaTokenResponse,
  type MetaLongLivedTokenResponse,
  type MetaAccountsResponse,
  type MetaInstagramBusinessAccountResponse,
  type MetaInstagramUserResponse,
} from "../../../../../lib/meta/types";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const log = createRequestLogger("oauth");
  const metaAppId = process.env.META_APP_ID;
  const metaAppSecret = process.env.META_APP_SECRET;
  const metaRedirectUri = process.env.META_REDIRECT_URI;

  if (!metaAppId || !metaAppSecret || !metaRedirectUri) {
    await log.error("oauth", "Missing Meta OAuth environment variables", {
      requestId,
      metadata: {
        hasAppId: Boolean(metaAppId),
        hasAppSecret: Boolean(metaAppSecret),
        hasRedirectUri: Boolean(metaRedirectUri),
      },
    });
    return NextResponse.redirect(
      new URL("/app/integrations?error=meta_config", request.url),
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  // Log ALL query params Meta sends back for debugging
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  if (errorParam) {
    await log.error("oauth", "Meta returned an error in callback", {
      requestId,
      metadata: {
        error: errorParam,
        errorReason: errorReason ?? undefined,
        errorDescription: errorDescription ?? undefined,
        allParams,
      },
    });
    const errorMsg = errorDescription ?? errorParam;
    const redirectUrl = new URL(
      `/app/integrations?error=${encodeURIComponent(errorMsg)}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    await log.warn("oauth", "OAuth callback missing code or state", {
      requestId,
      metadata: {
        hasCode: Boolean(code),
        hasState: Boolean(state),
        allParams,
      },
    });
    const redirectUrl = new URL(
      `/app/integrations?error=${encodeURIComponent("Verbindung fehlgeschlagen. Meta hat keine Autorisierung zurückgegeben.")}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createSupabaseServerClient();

  // Atomically validate AND consume state to prevent race conditions
  // DELETE ... RETURNING ensures only ONE request can succeed
  const { data: stateRow, error: stateError } = await supabase
    .from("oauth_states")
    .delete()
    .eq("state", state)
    .select("*")
    .single();

  if (stateError || !stateRow) {
    // State was already consumed - this is likely a duplicate callback
    // Try to extract user_id from state (format: user_id.random)
    const stateUserId = state.includes(".") ? state.split(".")[0] : null;

    if (stateUserId) {
      // Check if this user has a recently successful integration (within last 60 seconds)
      const { data: recentIntegration } = await supabase
        .from("integrations")
        .select("status, account_name, instagram_username, updated_at")
        .eq("user_id", stateUserId)
        .eq("provider", "meta")
        .eq("status", "connected")
        .gte("updated_at", new Date(Date.now() - 60000).toISOString())
        .maybeSingle();

      if (recentIntegration) {
        // A successful integration just happened for this user - redirect to success
        await log.info("oauth", "Duplicate callback detected, integration already exists", {
          requestId,
          userId: stateUserId,
          metadata: {
            accountName: recentIntegration.account_name,
            updatedAt: recentIntegration.updated_at,
          },
        });
        const accountLabel = recentIntegration.instagram_username ?? recentIntegration.account_name ?? "Meta";
        return NextResponse.redirect(
          new URL(`/app/integrations?success=true&account=${encodeURIComponent(accountLabel)}`, request.url),
        );
      }
    }

    await log.warn("oauth", "Invalid or expired OAuth state (already consumed or not found)", {
      requestId,
      metadata: {
        hasStateRow: Boolean(stateRow),
        error: stateError?.message,
        stateUserId: stateUserId ?? undefined,
      },
    });
    const redirectUrl = new URL(
      `/app/integrations?error=${encodeURIComponent("OAuth-Status ungültig, abgelaufen oder bereits verwendet.")}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Check state expiry
  if (new Date(stateRow.expires_at) < new Date()) {
    await log.warn("oauth", "OAuth state expired", {
      requestId,
      userId: stateRow.user_id,
    });
    const redirectUrl = new URL(
      `/app/integrations?error=${encodeURIComponent("OAuth-Status abgelaufen.")}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  let accountId = (stateRow as { account_id?: string | null }).account_id ?? null;
  if (!accountId) {
    const { data: membership, error: membershipError } = await supabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", stateRow.user_id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      await log.error("oauth", "Failed to resolve account membership", {
        requestId,
        userId: stateRow.user_id,
        metadata: { error: membershipError.message },
      });
    }

    accountId = membership?.account_id ?? null;
  }

  if (!accountId) {
    await log.error("oauth", "Account ID missing for OAuth callback", {
      requestId,
      userId: stateRow.user_id,
    });
    const redirectUrl = new URL(
      `/app/integrations?error=${encodeURIComponent("Account fehlt fuer OAuth-Verbindung.")}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Exchange code for short-lived token
  const tokenResponse = await fetch(
    `${META_GRAPH_BASE}/oauth/access_token?` +
      new URLSearchParams({
        client_id: metaAppId,
        client_secret: metaAppSecret,
        redirect_uri: metaRedirectUri,
        code,
      }),
  );

  const tokenResponseBody = await tokenResponse.json();

  if (!tokenResponse.ok) {
    await log.error("oauth", "Token exchange failed", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        httpStatus: tokenResponse.status,
        metaError: tokenResponseBody?.error ?? tokenResponseBody,
      },
    });
    const metaError = tokenResponseBody?.error ?? {};
    const errorSubcode =
      typeof metaError === "object" && metaError
        ? (metaError as { error_subcode?: number }).error_subcode
        : undefined;
    if (errorSubcode === 36009) {
      const { data: existingIntegration } = await supabase
        .from("integrations")
        .select("status,account_name,instagram_username")
        .eq("user_id", stateRow.user_id)
        .eq("provider", "meta")
        .maybeSingle();

      if (existingIntegration?.status === "connected") {
        const accountLabel =
          existingIntegration.instagram_username ??
          existingIntegration.account_name ??
          "Meta";
        const redirectUrl = new URL(
          `/app/integrations?success=true&account=${encodeURIComponent(accountLabel)}`,
          request.url,
        );
        return NextResponse.redirect(redirectUrl);
      }
    }

    const errorMessage =
      errorSubcode === 36009
        ? "OAuth-Code wurde bereits verwendet. Bitte erneut verbinden."
        : "Token-Tausch fehlgeschlagen.";
    const redirectUrl = new URL(
      `/app/integrations?error=${encodeURIComponent(errorMessage)}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  const shortLivedToken = tokenResponseBody as MetaTokenResponse;

  // Log full token response for debugging (access_token redacted)
  await log.info("oauth", "Short-lived token obtained", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      hasAccessToken: Boolean(shortLivedToken.access_token),
      tokenType: shortLivedToken.token_type,
      expiresIn: shortLivedToken.expires_in,
      // Log any extra fields Meta returns (e.g. granted_scopes)
      extraFields: Object.keys(tokenResponseBody).filter(k => k !== "access_token"),
      grantedScopes: (tokenResponseBody as Record<string, unknown>).granted_scopes ?? null,
    },
  });

  // Exchange short-lived token for long-lived token (60 days)
  const longLivedResponse = await fetch(
    `${META_GRAPH_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: metaAppId,
        client_secret: metaAppSecret,
        fb_exchange_token: shortLivedToken.access_token,
      }),
  );

  const longLivedBody = await longLivedResponse.json();

  if (!longLivedResponse.ok) {
    await log.error("oauth", "Long-lived token exchange failed", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        httpStatus: longLivedResponse.status,
        metaError: longLivedBody?.error ?? longLivedBody,
      },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Long-lived Token-Tausch fehlgeschlagen.")}`,
        request.url,
      ),
    );
  }

  const longLivedToken = longLivedBody as MetaLongLivedTokenResponse;

  await log.info("oauth", "Long-lived token obtained", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      hasAccessToken: Boolean(longLivedToken.access_token),
      expiresIn: longLivedToken.expires_in,
      expiresInType: typeof longLivedToken.expires_in,
    },
  });

  // Check which permissions the token actually has
  try {
    const permResponse = await fetch(
      `${META_GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(longLivedToken.access_token)}`,
    );
    const permData = await permResponse.json();
    await log.info("oauth", "Token permissions (GET /me/permissions)", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        httpStatus: permResponse.status,
        permissions: permData,
      },
    });
  } catch (permError) {
    await log.warn("oauth", "Failed to check token permissions", {
      requestId,
      userId: stateRow.user_id,
      metadata: { error: String(permError) },
    });
  }

  // Fetch Facebook user ID and name for debugging + data deletion mapping
  let facebookUserId: string | null = null;
  let facebookUserName: string | null = null;
  try {
    const meResponse = await fetch(
      `${META_GRAPH_BASE}/me?fields=id,name,email&access_token=${encodeURIComponent(longLivedToken.access_token)}`,
    );
    const meData = await meResponse.json();
    if (meResponse.ok) {
      facebookUserId = (meData as { id?: string }).id ?? null;
      facebookUserName = (meData as { name?: string }).name ?? null;
    }
    await log.info("oauth", "Facebook user identity", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        facebookUserId,
        facebookUserName,
        meResponseOk: meResponse.ok,
        meResponseStatus: meResponse.status,
        meResponseBody: meData,
      },
    });
  } catch (meError) {
    await log.warn("oauth", "Failed to fetch Facebook user ID", {
      requestId,
      userId: stateRow.user_id,
      metadata: { error: String(meError) },
    });
  }

  // Fetch user's Facebook pages
  const pagesResponse = await fetch(
    `${META_GRAPH_BASE}/me/accounts?` +
      new URLSearchParams({
        access_token: longLivedToken.access_token,
      }),
  );

  const pagesBody = await pagesResponse.json();

  // Log the FULL raw response from /me/accounts for debugging
  await log.info("oauth", "Raw /me/accounts response", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      httpStatus: pagesResponse.status,
      responseBody: pagesBody,
      facebookUserId,
      facebookUserName,
    },
  });

  if (!pagesResponse.ok) {
    await log.warn("oauth", "No Facebook pages returned", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        httpStatus: pagesResponse.status,
        metaError: pagesBody?.error ?? pagesBody,
      },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Keine Facebook-Seiten gefunden.")}`,
        request.url,
      ),
    );
  }

  const pagesData = pagesBody as MetaAccountsResponse;
  await log.info("oauth", "Fetched Facebook pages", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      pageCount: pagesData.data?.length ?? 0,
      pageNames: pagesData.data?.map((p) => p.name) ?? [],
    },
  });
  const firstPage = pagesData.data?.[0];

  if (!firstPage) {
    await log.warn("oauth", "No Facebook page available", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Keine Facebook-Seite gefunden. Bitte stelle sicher, dass du bei der Autorisierung mindestens eine Facebook-Seite auswählst, die mit deinem Instagram-Konto verknüpft ist.")}`,
        request.url,
      ),
    );
  }

  // Get Instagram Business Account ID from the page
  const igResponse = await fetch(
    `${META_GRAPH_BASE}/${firstPage.id}?` +
      new URLSearchParams({
        fields: "instagram_business_account",
        access_token: firstPage.access_token,
      }),
  );

  const igBody = await igResponse.json();

  if (!igResponse.ok) {
    const metaErrorObj = igBody?.error;
    const metaErrorMsg = typeof metaErrorObj === "object" && metaErrorObj?.message
      ? String(metaErrorObj.message)
      : "";
    const isPermissionError = metaErrorMsg.includes("missing permission") || metaErrorMsg.includes("pages_read_engagement");

    await log.warn("oauth", "Instagram business account not found", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        pageId: firstPage.id,
        pageName: firstPage.name,
        httpStatus: igResponse.status,
        metaError: metaErrorObj ?? igBody,
        isPermissionError,
      },
    });

    const userMessage = isPermissionError
      ? `Berechtigung fehlt: Dein Facebook-Konto hat nicht die nötigen Berechtigungen für die Seite "${firstPage.name}". Bitte erteile bei der Autorisierung alle angeforderten Berechtigungen (insbesondere Seitenzugriff).`
      : `Instagram-Konto nicht gefunden für die Seite "${firstPage.name}". Stelle sicher, dass ein Instagram Business- oder Creator-Konto mit dieser Facebook-Seite verknüpft ist.`;

    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent(userMessage)}`,
        request.url,
      ),
    );
  }

  const igData = igBody as MetaInstagramBusinessAccountResponse;
  const instagramId = igData.instagram_business_account?.id ?? null;

  if (!instagramId) {
    await log.warn("oauth", "Facebook page has no linked Instagram business account", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        pageId: firstPage.id,
        pageName: firstPage.name,
        igResponseBody: igBody,
      },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent(`Die Facebook-Seite "${firstPage.name}" hat kein verknüpftes Instagram Business- oder Creator-Konto. Bitte verbinde dein Instagram-Konto zuerst in den Instagram-Einstellungen unter "Verknüpfte Konten" mit deiner Facebook-Seite.`)}`,
        request.url,
      ),
    );
  }

  // Lookup Instagram username if we have the IG business account ID
  let instagramUsername: string | null = null;
  if (instagramId) {
    const igUserResponse = await fetch(
      `${META_GRAPH_BASE}/${instagramId}?` +
        new URLSearchParams({
          fields: "id,name,username",
          access_token: firstPage.access_token,
        }),
    );
    if (igUserResponse.ok) {
      const igUserData = (await igUserResponse.json()) as MetaInstagramUserResponse;
      instagramUsername = igUserData.username ?? null;
    }
  }
  await log.info("oauth", "Instagram account resolved", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      instagramId: instagramId ?? undefined,
      instagramUsername: instagramUsername ?? undefined,
    },
  });

  await log.info("oauth", "Saving integration to database", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      pageId: firstPage.id,
      accountName: firstPage.name,
    },
  });

  // Upsert integration record with explicit error handling
  try {
    // Calculate expires_at safely - default to 60 days if expires_in is missing
    const expiresInSeconds = typeof longLivedToken.expires_in === "number" && longLivedToken.expires_in > 0
      ? longLivedToken.expires_in
      : 60 * 24 * 60 * 60; // 60 days in seconds
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const { error: integrationError } = await supabase
      .from("integrations")
      .upsert(
        {
          user_id: stateRow.user_id,
          account_id: accountId,
          provider: "meta",
          status: "connected",
          access_token: firstPage.access_token,
          refresh_token: longLivedToken.access_token,
          expires_at: expiresAt,
          page_id: firstPage.id,
          instagram_id: instagramId,
          instagram_username: instagramUsername,
          account_name: firstPage.name,
          facebook_user_id: facebookUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );

    if (integrationError) {
      await log.logError("oauth", integrationError, "Failed to save integration", {
        requestId,
        userId: stateRow.user_id,
      });
      return NextResponse.redirect(
        new URL(
          `/app/integrations?error=${encodeURIComponent("Integration konnte nicht gespeichert werden.")}`,
          request.url,
        ),
      );
    }

    // Subscribe the page to webhook events so Meta forwards DMs to our webhook
    try {
      const subscribeResponse = await fetch(
        `${META_GRAPH_BASE}/${firstPage.id}/subscribed_apps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscribed_fields: ["messages", "messaging_postbacks"],
            access_token: firstPage.access_token,
          }),
        },
      );

      const subscribeBody = await subscribeResponse.json();

      if (!subscribeResponse.ok) {
        await log.warn("oauth", "Page webhook subscription failed (non-blocking)", {
          requestId,
          userId: stateRow.user_id,
          metadata: {
            pageId: firstPage.id,
            httpStatus: subscribeResponse.status,
            metaError: subscribeBody?.error ?? subscribeBody,
          },
        });
      } else {
        await log.info("oauth", "Page subscribed to webhook events", {
          requestId,
          userId: stateRow.user_id,
          metadata: {
            pageId: firstPage.id,
            success: subscribeBody?.success,
          },
        });
      }
    } catch (subscribeError) {
      await log.warn("oauth", "Page webhook subscription error (non-blocking)", {
        requestId,
        userId: stateRow.user_id,
        metadata: { pageId: firstPage.id, error: String(subscribeError) },
      });
    }

    await log.info("oauth", "OAuth flow completed successfully", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        pageId: firstPage.id,
        accountName: firstPage.name,
        instagramUsername: instagramUsername ?? undefined,
      },
    });

    const accountLabel = instagramUsername ?? firstPage.name;
    const redirectUrl = new URL(
      `/app/integrations?success=true&account=${encodeURIComponent(accountLabel)}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  } catch (upsertError) {
    await log.logError("oauth", upsertError, "Unexpected error during integration save", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Unerwarteter Fehler beim Speichern.")}`,
        request.url,
      ),
    );
  }
}
