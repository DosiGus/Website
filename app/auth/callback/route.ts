import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app";

  const successUrl = request.nextUrl.clone();
  successUrl.pathname = next;
  successUrl.searchParams.delete("token_hash");
  successUrl.searchParams.delete("type");
  successUrl.searchParams.delete("code");
  successUrl.searchParams.delete("next");

  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = "/login";
  errorUrl.searchParams.set("error", "auth_callback_failed");

  // Handle PKCE code exchange (Google OAuth, other OAuth providers)
  if (code) {
    const response = NextResponse.redirect(successUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Set cookies on the redirect response so the browser receives them
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Handle invite acceptance: add the new user to the invited account
      const invitedAccountId = sessionData?.user?.user_metadata?.invited_account_id;
      const invitedRole = sessionData?.user?.user_metadata?.invited_role;
      if (invitedAccountId && invitedRole && sessionData?.user?.id) {
        try {
          const supabaseAdmin = createSupabaseServerClient();
          const { data: existing } = await supabaseAdmin
            .from("account_members")
            .select("id")
            .eq("account_id", invitedAccountId)
            .eq("user_id", sessionData.user.id)
            .maybeSingle();
          if (!existing) {
            await supabaseAdmin
              .from("account_members")
              .insert({ account_id: invitedAccountId, user_id: sessionData.user.id, role: invitedRole });
          }
        } catch {
          // Non-critical: user is still authenticated, invite membership can be added manually
          console.error("[auth/callback] Failed to add invited user to account_members");
        }
      }
      return response;
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message, error.status);
  }

  // Handle token_hash verification (email confirmation, password recovery)
  if (token_hash && type) {
    const response = NextResponse.redirect(successUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return response;
    console.error("[auth/callback] verifyOtp failed:", error.message);
  }

  // Fallback: redirect to login with error
  console.error("[auth/callback] fallback – no code and no token_hash, params:", Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.redirect(errorUrl);
}
