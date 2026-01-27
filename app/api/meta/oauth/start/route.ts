import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { requireUser } from "../../../../../lib/apiAuth";
import { META_PERMISSIONS } from "../../../../../lib/meta/types";
import { createRequestLogger } from "../../../../../lib/logger";
import crypto from "crypto";

const META_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger("oauth");
  try {
    const user = await requireUser(request);
    await log.info("oauth", "OAuth start requested", {
      requestId,
      userId: user.id,
      metadata: {
        userAgent: request.headers.get("user-agent") || undefined,
        referer: request.headers.get("referer") || undefined,
      },
    });
    const metaAppId = process.env.META_APP_ID;
    const metaRedirectUri = process.env.META_REDIRECT_URI;
    const metaLoginConfigId = process.env.META_LOGIN_CONFIG_ID;

    if (!metaAppId || !metaRedirectUri) {
      await log.error("oauth", "Missing Meta OAuth environment variables", {
        requestId,
        userId: user.id,
        metadata: {
          hasAppId: Boolean(metaAppId),
          hasRedirectUri: Boolean(metaRedirectUri),
          hasConfigId: Boolean(metaLoginConfigId),
        },
      });
      return NextResponse.json(
        { error: "META_APP_ID oder META_REDIRECT_URI fehlt." },
        { status: 500 },
      );
    }

    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("oauth_states").insert({
      user_id: user.id,
      state,
      expires_at: expiresAt,
    });

    if (error) {
      await log.logError("oauth", error, "Failed to store OAuth state", {
        requestId,
        userId: user.id,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const scope = META_PERMISSIONS.join(",");

    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: metaRedirectUri,
      response_type: "code",
      scope,
      state,
    });

    if (metaLoginConfigId) {
      params.set("config_id", metaLoginConfigId);
    }

    await log.info("oauth", "Redirecting to Meta OAuth", {
      requestId,
      userId: user.id,
      metadata: {
        redirectUri: metaRedirectUri,
        scope,
        configId: metaLoginConfigId ?? undefined,
      },
    });

    return NextResponse.json({ url: `${META_OAUTH_BASE}?${params.toString()}` });
  } catch (error) {
    await log.logError("oauth", error, "OAuth start failed", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
