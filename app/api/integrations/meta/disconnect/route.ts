// DEPRECATED: Use DELETE /api/integrations instead
import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";

export async function POST(request: Request) {
  try {
    const { accountId, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const supabase = createSupabaseServerClient();

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "disconnected" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
