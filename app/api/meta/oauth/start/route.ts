import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { META_PERMISSIONS } from "../../../../../lib/meta/types";
import { createRequestLogger } from "../../../../../lib/logger";
import crypto from "crypto";

const META_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger("oauth");
  try {
    const { user, accountId } = await requireAccountMember(request);
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Always use standard scope-based OAuth (NOT Facebook Login for Business).
    // FLB (config_id) does NOT properly register the app at the Instagram account
    // level — it won't appear in Instagram Settings > Apps und Websites, and Meta
    // will NOT deliver Instagram DM webhooks without that registration.
    // Standard OAuth with instagram_manage_messages scope properly registers the
    // app and enables webhook delivery.
    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: metaRedirectUri,
      response_type: "code",
      state,
      scope: META_PERMISSIONS.join(","),
    });

    await log.info("oauth", "Redirecting to Meta OAuth (scope-based)", {
      requestId,
      userId: user.id,
      metadata: {
        redirectUri: metaRedirectUri,
        scope: META_PERMISSIONS.join(","),
      },
    });

    return NextResponse.json({ url: `${META_OAUTH_BASE}?${params.toString()}` });
  } catch (error) {
    await log.logError("oauth", error, "OAuth start failed", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
