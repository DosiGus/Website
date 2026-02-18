// DEPRECATED: Use DELETE /api/integrations instead
import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../../lib/apiAuth";
import { createRequestLogger } from "../../../../../lib/logger";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";
import { decryptToken } from "../../../../../lib/security/tokenEncryption";
import { META_GRAPH_BASE } from "../../../../../lib/meta/types";

export async function POST(request: Request) {
  try {
    const { accountId, role, supabase, user } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const rateLimit = await checkRateLimit(`integrations_meta_disconnect:${accountId}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("id, access_token")
      .eq("account_id", accountId)
      .eq("provider", "meta")
      .maybeSingle();

    if (integration?.access_token) {
      try {
        const accessToken = decryptToken(integration.access_token);
        if (accessToken) {
          await fetch(
            `${META_GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
            { method: "DELETE" },
          );
        }
      } catch (error) {
        const reqLogger = createRequestLogger("api", user.id, accountId);
        await reqLogger.warn("api", "Failed to revoke Meta token during disconnect", {
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    const { error } = await supabase
      .from("integrations")
      .update({
        status: "disconnected",
        access_token: null,
        refresh_token: null,
        expires_at: null,
        page_id: null,
        instagram_id: null,
        account_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", accountId)
      .eq("provider", "meta");

    if (error) {
      const reqLogger = createRequestLogger("api", user.id, accountId);
      await reqLogger.error("api", "Failed to disconnect meta integration", {
        metadata: { accountId, error: error.message },
      });
      return NextResponse.json({ error: "Integration konnte nicht getrennt werden" }, { status: 500 });
    }

    const reqLogger = createRequestLogger("api", user.id, accountId);
    await reqLogger.info("api", "Meta integration disconnected", {
      metadata: { accountId },
    });

    return NextResponse.json({ status: "disconnected" });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
