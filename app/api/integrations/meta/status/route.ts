// DEPRECATED: Use GET /api/integrations instead
import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";

export async function GET(request: Request) {
  try {
    const { accountId } = await requireAccountMember(request);
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("integrations")
      .select(
        "provider,status,account_name,instagram_id,page_id,expires_at,updated_at",
      )
      .eq("account_id", accountId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ status: "disconnected" });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
