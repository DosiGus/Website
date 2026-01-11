import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
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
      .eq("user_id", user.id)
      .eq("provider", "meta");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "disconnected" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
