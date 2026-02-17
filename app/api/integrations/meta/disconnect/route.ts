// DEPRECATED: Use DELETE /api/integrations instead
import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../../lib/apiAuth";
import { createRequestLogger } from "../../../../../lib/logger";

export async function POST(request: Request) {
  try {
    const { accountId, role, supabase } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
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
      const reqLogger = createRequestLogger("api");
      await reqLogger.error("api", "Failed to disconnect meta integration", {
        metadata: { accountId, error: error.message },
      });
      return NextResponse.json({ error: "Integration konnte nicht getrennt werden" }, { status: 500 });
    }

    const reqLogger = createRequestLogger("api");
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
