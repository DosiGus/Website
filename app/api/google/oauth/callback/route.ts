import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../../lib/logger";
import { encryptToken } from "../../../../../lib/security/tokenEncryption";
import {
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  type GoogleTokenResponse,
  type GoogleUserInfoResponse,
} from "../../../../../lib/google/types";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const log = createRequestLogger("oauth");
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
    const missing: string[] = [];
    if (!googleClientId) missing.push("GOOGLE_CLIENT_ID");
    if (!googleClientSecret) missing.push("GOOGLE_CLIENT_SECRET");
    if (!googleRedirectUri) missing.push("GOOGLE_REDIRECT_URI");
    await log.error("oauth", "Missing Google OAuth environment variables", {
      requestId,
      metadata: {
        hasClientId: Boolean(googleClientId),
        hasClientSecret: Boolean(googleClientSecret),
        hasRedirectUri: Boolean(googleRedirectUri),
        missing,
      },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent(`google_config: ${missing.join(", ")}`)}&provider=google`,
        request.url,
      ),
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const errorMsg = errorDescription ?? errorParam;
    await log.error("oauth", "Google returned an error in callback", {
      requestId,
      metadata: { error: errorParam, errorDescription: errorMsg },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent(errorMsg)}&provider=google`,
        request.url,
      ),
    );
  }

  if (!code || !state) {
    await log.warn("oauth", "Google OAuth callback missing code or state", {
      requestId,
      metadata: { hasCode: Boolean(code), hasState: Boolean(state) },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Verbindung fehlgeschlagen. Google hat keine Autorisierung zurückgegeben.")}&provider=google`,
        request.url,
      ),
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: stateRow, error: stateError } = await supabase
    .from("oauth_states")
    .delete()
    .eq("state", state)
    .select("*")
    .single();

  if (stateError || !stateRow) {
    await log.warn("oauth", "Invalid or expired Google OAuth state", {
      requestId,
      metadata: { error: stateError?.message },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("OAuth-Status ungültig, abgelaufen oder bereits verwendet.")}&provider=google`,
        request.url,
      ),
    );
  }

  if (new Date(stateRow.expires_at) < new Date()) {
    await log.warn("oauth", "Google OAuth state expired", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("OAuth-Status abgelaufen.")}&provider=google`,
        request.url,
      ),
    );
  }

  let accountId = (stateRow as { account_id?: string | null }).account_id ?? null;
  if (!accountId) {
    const { data: memberships, error: membershipError } = await supabase
      .from("account_members")
      .select("account_id, role, joined_at")
      .eq("user_id", stateRow.user_id);

    if (membershipError) {
      await log.error("oauth", "Failed to resolve account membership", {
        requestId,
        userId: stateRow.user_id,
        metadata: { error: membershipError.message },
      });
    }

    const rolePriority: Record<string, number> = {
      viewer: 0,
      member: 1,
      admin: 2,
      owner: 3,
    };
    const sorted = (memberships ?? []).sort((a, b) => {
      const roleDelta =
        (rolePriority[String(b.role)] ?? 0) - (rolePriority[String(a.role)] ?? 0);
      if (roleDelta !== 0) return roleDelta;
      const aJoined = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const bJoined = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      return aJoined - bJoined;
    });
    accountId = sorted[0]?.account_id ?? null;
  }

  if (!accountId) {
    await log.error("oauth", "Account ID missing for Google OAuth callback", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Account fehlt fuer OAuth-Verbindung.")}&provider=google`,
        request.url,
      ),
    );
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: googleRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenBody = (await tokenResponse.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenBody.access_token) {
    await log.error("oauth", "Google token exchange failed", {
      requestId,
      userId: stateRow.user_id,
      metadata: {
        httpStatus: tokenResponse.status,
        error: tokenBody.error ?? "unknown_error",
        errorDescription: tokenBody.error_description,
      },
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Token-Tausch fehlgeschlagen.")}&provider=google`,
        request.url,
      ),
    );
  }

  let userInfo: GoogleUserInfoResponse | null = null;
  try {
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });
    if (userInfoResponse.ok) {
      userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;
    }
  } catch (error) {
    await log.logError("oauth", error, "Failed to fetch Google user info", {
      requestId,
      userId: stateRow.user_id,
    });
  }

  let refreshToken = tokenBody.refresh_token ?? null;
  if (!refreshToken) {
    const { data: existingIntegration } = await supabase
      .from("integrations")
      .select("refresh_token")
      .eq("account_id", accountId)
      .eq("provider", "google_calendar")
      .maybeSingle();
    refreshToken = existingIntegration?.refresh_token ?? null;
  }

  const expiresInSeconds =
    typeof tokenBody.expires_in === "number" && tokenBody.expires_in > 0
      ? tokenBody.expires_in
      : 3600;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const accountLabel =
    userInfo?.email || userInfo?.name || "Google Kalender";

  const encryptedAccessToken = encryptToken(tokenBody.access_token);
  const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

  const { error: integrationError } = await supabase
    .from("integrations")
    .upsert(
      {
        user_id: stateRow.user_id,
        account_id: accountId,
        provider: "google_calendar",
        status: "connected",
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        account_name: accountLabel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (integrationError) {
    await log.logError("oauth", integrationError, "Failed to save Google integration", {
      requestId,
      userId: stateRow.user_id,
    });
    return NextResponse.redirect(
      new URL(
        `/app/integrations?error=${encodeURIComponent("Integration konnte nicht gespeichert werden.")}&provider=google`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/app/integrations?success=true&provider=google&account=${encodeURIComponent(accountLabel)}`,
      request.url,
    ),
  );
}
