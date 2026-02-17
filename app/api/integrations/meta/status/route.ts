// DEPRECATED: Use GET /api/integrations instead
import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";

export async function GET(request: Request) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);

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
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
