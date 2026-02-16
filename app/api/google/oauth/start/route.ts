import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { createRequestLogger } from "../../../../../lib/logger";
import { GOOGLE_OAUTH_BASE, GOOGLE_OAUTH_SCOPES } from "../../../../../lib/google/types";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger("oauth");

  try {
    const { user, accountId } = await requireAccountMember(request);
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!googleClientId || !googleRedirectUri) {
      const missing: string[] = [];
      if (!googleClientId) missing.push("GOOGLE_CLIENT_ID");
      if (!googleRedirectUri) missing.push("GOOGLE_REDIRECT_URI");
      await log.error("oauth", "Missing Google OAuth environment variables", {
        requestId,
        userId: user.id,
        metadata: {
          hasClientId: Boolean(googleClientId),
          hasRedirectUri: Boolean(googleRedirectUri),
          missing,
        },
      });
      return NextResponse.json(
        { error: `Fehlende Google-ENV: ${missing.join(", ")}` },
        { status: 500 },
      );
    }

    const supabase = createSupabaseServerClient();
    const state = `${user.id}.${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("oauth_states").insert({
      user_id: user.id,
      account_id: accountId,
      state,
      expires_at: expiresAt,
    });

    if (error) {
      await log.logError("oauth", error, "Failed to store Google OAuth state", {
        requestId,
        userId: user.id,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: googleRedirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: GOOGLE_OAUTH_SCOPES.join(" "),
      state,
    });

    await log.info("oauth", "Redirecting to Google OAuth", {
      requestId,
      userId: user.id,
      metadata: {
        redirectUri: googleRedirectUri,
        scope: GOOGLE_OAUTH_SCOPES,
      },
    });

    return NextResponse.json({ url: `${GOOGLE_OAUTH_BASE}?${params.toString()}` });
  } catch (error) {
    await log.logError("oauth", error, "Google OAuth start failed", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
