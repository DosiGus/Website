import { createSupabaseServerClient } from "../supabaseServerClient";
import { GOOGLE_TOKEN_URL } from "./types";
import { logger } from "../logger";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type GoogleIntegrationRow = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

type AccessTokenResult = {
  accessToken: string;
  integrationId: string;
};

export async function getGoogleAccessToken(accountId: string): Promise<AccessTokenResult> {
  const supabase = createSupabaseServerClient();
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, access_token, refresh_token, expires_at")
    .eq("account_id", accountId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (error) {
    throw new Error("Integration konnte nicht geladen werden.");
  }

  if (!integration?.access_token) {
    throw new Error("Google Kalender ist nicht verbunden.");
  }

  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0;
  const needsRefresh = !expiresAt || Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt;

  if (!needsRefresh) {
    return {
      accessToken: integration.access_token,
      integrationId: integration.id,
    };
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth ist nicht korrekt konfiguriert.");
  }

  if (!integration.refresh_token) {
    throw new Error("Refresh-Token fehlt. Bitte Google Kalender erneut verbinden.");
  }

  const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: integration.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const refreshBody = (await refreshResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!refreshResponse.ok || !refreshBody.access_token) {
    await logger.warn("oauth", "Google token refresh failed", {
      metadata: {
        httpStatus: refreshResponse.status,
        error: refreshBody.error ?? "unknown_error",
        errorDescription: refreshBody.error_description,
      },
    });
    throw new Error("Token-Erneuerung fehlgeschlagen. Bitte erneut verbinden.");
  }

  const expiresInSeconds =
    typeof refreshBody.expires_in === "number" && refreshBody.expires_in > 0
      ? refreshBody.expires_in
      : 3600;
  const expiresAtIso = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("integrations")
    .update({
      access_token: refreshBody.access_token,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (updateError) {
    await logger.warn("oauth", "Failed to store refreshed Google token", {
      metadata: { error: updateError.message },
    });
  }

  return {
    accessToken: refreshBody.access_token,
    integrationId: integration.id,
  };
}
