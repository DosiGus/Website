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
    return NextResponse.json(
      { error: "META_APP_ID, META_APP_SECRET oder META_REDIRECT_URI fehlt." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (!code || !state) {
    await log.warn("oauth", "OAuth callback missing code or state", {
      requestId,
      metadata: {
        hasCode: Boolean(code),
        hasState: Boolean(state),
        error: errorParam || undefined,
      },
    });
    return NextResponse.json({ error: "Code oder State fehlt." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Validate CSRF state
  const { data: stateRow, error: stateError } = await supabase
    .from("oauth_states")
    .select("*")
    .eq("state", state)
    .single();

  if (stateError || !stateRow) {
    await log.warn("oauth", "Invalid or expired OAuth state", {
      requestId,
      metadata: {
        hasStateRow: Boolean(stateRow),
      },
    });
    return NextResponse.json({ error: "State ungültig oder abgelaufen." }, { status: 400 });
  }

  // Check state expiry
  if (new Date(stateRow.expires_at) < new Date()) {
    await supabase.from("oauth_states").delete().eq("state", state);
    await log.warn("oauth", "OAuth state expired", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.json({ error: "State abgelaufen." }, { status: 400 });
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

  if (!tokenResponse.ok) {
    await log.error("oauth", "Token exchange failed", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.json({ error: "Token-Tausch fehlgeschlagen." }, { status: 500 });
  }

  const shortLivedToken = (await tokenResponse.json()) as MetaTokenResponse;

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

  if (!longLivedResponse.ok) {
    await log.error("oauth", "Long-lived token exchange failed", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.json({ error: "Long-lived Token-Tausch fehlgeschlagen." }, { status: 500 });
  }

  const longLivedToken = (await longLivedResponse.json()) as MetaLongLivedTokenResponse;

  // Fetch user's Facebook pages
  const pagesResponse = await fetch(
    `${META_GRAPH_BASE}/me/accounts?` +
      new URLSearchParams({
        access_token: longLivedToken.access_token,
      }),
  );

  if (!pagesResponse.ok) {
    await log.warn("oauth", "No Facebook pages returned", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.json({ error: "Keine Facebook-Seiten gefunden." }, { status: 400 });
  }

  const pagesData = (await pagesResponse.json()) as MetaAccountsResponse;
  await log.info("oauth", "Fetched Facebook pages", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      pageCount: pagesData.data?.length ?? 0,
    },
  });
  const firstPage = pagesData.data?.[0];

  if (!firstPage) {
    await log.warn("oauth", "No Facebook page available", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.json({ error: "Keine Facebook-Seite verfügbar." }, { status: 400 });
  }

  // Get Instagram Business Account ID from the page
  const igResponse = await fetch(
    `${META_GRAPH_BASE}/${firstPage.id}?` +
      new URLSearchParams({
        fields: "instagram_business_account",
        access_token: firstPage.access_token,
      }),
  );

  if (!igResponse.ok) {
    await log.warn("oauth", "Instagram business account not found", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        pageId: firstPage.id,
      },
    });
    return NextResponse.json({ error: "Instagram Account nicht gefunden." }, { status: 400 });
  }

  const igData = (await igResponse.json()) as MetaInstagramBusinessAccountResponse;
  const instagramId = igData.instagram_business_account?.id ?? null;

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

  // Upsert integration record
  const { error: integrationError } = await supabase
    .from("integrations")
    .upsert(
      {
        user_id: stateRow.user_id,
        provider: "meta",
        status: "connected",
        access_token: firstPage.access_token,
        refresh_token: longLivedToken.access_token,
        expires_at: new Date(Date.now() + longLivedToken.expires_in * 1000).toISOString(),
        page_id: firstPage.id,
        instagram_id: instagramId,
        instagram_username: instagramUsername,
        account_name: firstPage.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

  // Clean up used state
  await supabase.from("oauth_states").delete().eq("state", state);

  if (integrationError) {
    await log.logError("oauth", integrationError, "Failed to save integration", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.json({ error: integrationError.message }, { status: 500 });
  }

  await log.info("oauth", "OAuth flow completed", {
    requestId,
    userId: stateRow.user_id,
    metadata: {
      pageId: firstPage.id,
      accountName: firstPage.name,
    },
  });

  const accountLabel = instagramUsername ?? firstPage.name;
  const redirectUrl = new URL(
    `/app/integrations?success=true&account=${encodeURIComponent(accountLabel)}`,
    request.url,
  );
  return NextResponse.redirect(redirectUrl);
}
