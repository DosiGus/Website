import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { requireAccountMember, isRoleAtLeast } from "../../../../../lib/apiAuth";
import { META_PERMISSIONS } from "../../../../../lib/meta/types";
import { createRequestLogger } from "../../../../../lib/logger";
import crypto from "crypto";

const META_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger("oauth");
  try {
    const { user, accountId, role } = await requireAccountMember(request);
    log.setAccountId(accountId);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
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

    if (!metaAppId || !metaRedirectUri) {
      await log.error("oauth", "Missing Meta OAuth environment variables", {
        requestId,
        userId: user.id,
        metadata: {
          hasAppId: Boolean(metaAppId),
          hasRedirectUri: Boolean(metaRedirectUri),
        },
      });
      return NextResponse.json(
        { error: "META_APP_ID oder META_REDIRECT_URI fehlt." },
        { status: 500 },
      );
    }

    const supabase = createSupabaseServerClient();

    // Encode user_id in state for duplicate callback detection
    // Format: user_id.random (user_id can be extracted even if state is deleted)
    const state = `${user.id}.${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("oauth_states").insert({
      user_id: user.id,
      account_id: accountId,
      state,
      expires_at: expiresAt,
    });

    if (error) {
      await log.logError("oauth", error, "Failed to store OAuth state", {
        requestId,
        userId: user.id,
      });
      return NextResponse.json({ error: "OAuth konnte nicht gestartet werden" }, { status: 500 });
    }

    // Use Facebook Login for Business (FLB) with config_id.
    // FLB shows the full consent dialog including the Instagram-specific
    // permissions step ("Allow access to messages"), which registers the app
    // at the Instagram account level. Without this registration, the app
    // won't appear in Instagram > Settings > Apps und Websites, and Meta
    // will NOT deliver Instagram DM webhooks.
    // Standard scope-based OAuth silently grants permissions at the Facebook
    // level without the Instagram registration step.
    // Note: /me/accounts may return empty with FLB tokens — this is handled
    // by Approach 4 (debug_token target_ids) in the callback.
    const configId = process.env.META_LOGIN_CONFIG_ID;

    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: metaRedirectUri,
      response_type: "code",
      state,
    });

    if (configId) {
      // FLB mode: config_id defines permissions, do NOT include scope
      params.set("config_id", configId);
    } else {
      // Fallback: scope-based OAuth if no config_id is set
      params.set("scope", META_PERMISSIONS.join(","));
    }

    await log.info("oauth", `Redirecting to Meta OAuth (${configId ? "FLB config_id" : "scope-based"})`, {
      requestId,
      userId: user.id,
      metadata: {
        redirectUri: metaRedirectUri,
        configId: configId ?? null,
        scope: configId ? null : META_PERMISSIONS.join(","),
      },
    });

    return NextResponse.json({ url: `${META_OAUTH_BASE}?${params.toString()}` });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    await log.logError("oauth", error, "OAuth start failed", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
