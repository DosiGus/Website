import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("integrations")
      .select(
        "provider,status,account_name,instagram_id,instagram_username,page_id,expires_at,updated_at",
      )
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integrations: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { provider?: string };
    const provider = body?.provider;

    if (!provider) {
      return NextResponse.json({ error: "Provider fehlt." }, { status: 400 });
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
        instagram_username: null,
        account_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "disconnected" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
