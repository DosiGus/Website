import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabaseServerClient";

const META_GRAPH_BASE = "https://graph.facebook.com/v19.0";

type MetaTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type MetaAccountsResponse = {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
  }>;
};

type MetaInstagramResponse = {
  instagram_business_account?: {
    id: string;
  };
};

export async function GET(request: Request) {
  const metaAppId = process.env.META_APP_ID;
  const metaAppSecret = process.env.META_APP_SECRET;
  const metaRedirectUri = process.env.META_REDIRECT_URI;

  if (!metaAppId || !metaAppSecret || !metaRedirectUri) {
    return NextResponse.json(
      { error: "META_APP_ID, META_APP_SECRET oder META_REDIRECT_URI fehlt." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Code oder State fehlt." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: stateRow, error: stateError } = await supabase
    .from("oauth_states")
    .select("*")
    .eq("state", state)
    .single();

  if (stateError || !stateRow) {
    return NextResponse.json({ error: "State ungültig oder abgelaufen." }, { status: 400 });
  }

  const tokenResponse = await fetch(
    `${META_GRAPH_BASE}/oauth/access_token?` +
      new URLSearchParams({
        client_id: metaAppId,
        client_secret: metaAppSecret,
        redirect_uri: metaRedirectUri,
        code,
      }),
  );

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Token-Tausch fehlgeschlagen." }, { status: 500 });
  }

  const tokenData = (await tokenResponse.json()) as MetaTokenResponse;

  const pagesResponse = await fetch(
    `${META_GRAPH_BASE}/me/accounts?` +
      new URLSearchParams({
        access_token: tokenData.access_token,
      }),
  );

  if (!pagesResponse.ok) {
    return NextResponse.json({ error: "Keine Facebook-Seiten gefunden." }, { status: 400 });
  }

  const pagesData = (await pagesResponse.json()) as MetaAccountsResponse;
  const firstPage = pagesData.data?.[0];

  if (!firstPage) {
    return NextResponse.json({ error: "Keine Facebook-Seite verfügbar." }, { status: 400 });
  }

  const igResponse = await fetch(
    `${META_GRAPH_BASE}/${firstPage.id}?` +
      new URLSearchParams({
        fields: "instagram_business_account",
        access_token: firstPage.access_token,
      }),
  );

  if (!igResponse.ok) {
    return NextResponse.json({ error: "Instagram Account nicht gefunden." }, { status: 400 });
  }

  const igData = (await igResponse.json()) as MetaInstagramResponse;
  const instagramId = igData.instagram_business_account?.id ?? null;

  const { error: integrationError } = await supabase
    .from("integrations")
    .upsert(
      {
        user_id: stateRow.user_id,
        provider: "meta",
        status: "connected",
        access_token: firstPage.access_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        page_id: firstPage.id,
        instagram_id: instagramId,
        account_name: firstPage.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

  await supabase.from("oauth_states").delete().eq("state", state);

  if (integrationError) {
    return NextResponse.json({ error: integrationError.message }, { status: 500 });
  }

  const redirectUrl = new URL("/app/integrations?connected=meta", request.url);
  return NextResponse.redirect(redirectUrl);
}
