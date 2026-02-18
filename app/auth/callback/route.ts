import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
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
  }

  // Fallback: redirect to login with error
  return NextResponse.redirect(errorUrl);
}
