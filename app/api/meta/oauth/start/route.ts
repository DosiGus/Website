import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";
import { requireUser } from "../../../../../lib/apiAuth";
import crypto from "crypto";

const META_OAUTH_BASE = "https://www.facebook.com/v19.0/dialog/oauth";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const metaAppId = process.env.META_APP_ID;
    const metaRedirectUri = process.env.META_REDIRECT_URI;

    if (!metaAppId || !metaRedirectUri) {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const scope = [
      "pages_show_list",
      "pages_manage_metadata",
      "instagram_basic",
      "instagram_manage_messages",
      "instagram_manage_comments",
    ].join(",");

    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: metaRedirectUri,
      response_type: "code",
      scope,
      state,
    });

    return NextResponse.json({ url: `${META_OAUTH_BASE}?${params.toString()}` });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
