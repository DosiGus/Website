import { NextResponse } from "next/server";
import crypto from "crypto";
import { createRequestLogger } from "../../../../lib/logger";
import { createClient } from "@supabase/supabase-js";

type SignedRequestPayload = {
  algorithm?: string;
  issued_at?: number;
  user_id?: string;
};

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function parseSignedRequest(
  signedRequest: string,
  appSecret: string
): { payload?: SignedRequestPayload; error?: string } {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) {
    return { error: "Invalid signed_request format." };
  }

  const [encodedSig, encodedPayload] = parts;
  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();
  const actualSig = base64UrlDecode(encodedSig);

  if (
    actualSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(actualSig, expectedSig)
  ) {
    return { error: "Invalid signed_request signature." };
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload).toString("utf8");
    const payload = JSON.parse(payloadJson) as SignedRequestPayload;
    if (payload.algorithm && payload.algorithm !== "HMAC-SHA256") {
      return { error: "Unsupported signed_request algorithm." };
    }
    return { payload };
  } catch {
    return { error: "Failed to parse signed_request payload." };
  }
}

/**
 * Delete Meta/Instagram data associated with a Facebook user ID.
 * We disconnect the integration and remove stored tokens, without deleting
 * unrelated account data or historical conversations.
 */
async function deleteUserData(facebookUserId: string, reqLogger: ReturnType<typeof createRequestLogger>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    await reqLogger.error("oauth", "Missing Supabase credentials for data deletion");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find Meta integrations linked to this Facebook user ID
  const { data: integrations, error: integrationError } = await supabase
    .from("integrations")
    .select("id, account_id")
    .eq("facebook_user_id", facebookUserId)
    .eq("provider", "meta");

  if (integrationError) {
    await reqLogger.error("oauth", "Failed to load integrations for data deletion", {
      metadata: { error: integrationError.message, facebookUserId },
    });
    return;
  }

  if (!integrations || integrations.length === 0) {
    await reqLogger.info("oauth", "No integrations found for Facebook user ID, data deletion logged for manual review", {
      metadata: { facebookUserId },
    });
    return;
  }

  for (const integration of integrations) {
    const { error: disconnectError } = await supabase
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
        facebook_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    if (disconnectError) {
      await reqLogger.error("oauth", "Failed to disconnect integration during data deletion", {
        metadata: {
          error: disconnectError.message,
          facebookUserId,
          integrationId: integration.id,
        },
      });
      continue;
    }

    await reqLogger.info("oauth", "Meta data deletion completed (integration disconnected)", {
      metadata: {
        accountId: integration.account_id,
        integrationId: integration.id,
        facebookUserId,
      },
    });
  }
}

export async function POST(request: Request) {
  const reqLogger = createRequestLogger("oauth");
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    await reqLogger.error("oauth", "META_APP_SECRET missing for data deletion");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const formData = await request.formData();
  const signedRequest = formData.get("signed_request");

  if (typeof signedRequest !== "string") {
    await reqLogger.warn("oauth", "Missing signed_request in data deletion callback");
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const { payload, error } = parseSignedRequest(signedRequest, appSecret);
  if (!payload || error) {
    await reqLogger.warn("oauth", "Invalid signed_request in data deletion callback", {
      metadata: { error },
    });
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const confirmationCode = crypto.randomUUID();

  // Use production URL instead of request.url to avoid internal Vercel URLs
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "https://wesponde.com";
  const statusUrl = new URL("/data-deletion", baseUrl);
  statusUrl.searchParams.set("code", confirmationCode);

  await reqLogger.info("oauth", "Data deletion request received", {
    metadata: {
      userId: payload.user_id ?? null,
      issuedAt: payload.issued_at ?? null,
      confirmationCode,
    },
  });

  // Attempt to delete user data if we have a Facebook user ID
  if (payload.user_id) {
    try {
      await deleteUserData(payload.user_id, reqLogger);
    } catch (err) {
      await reqLogger.error("oauth", "Error during data deletion", {
        metadata: {
          userId: payload.user_id,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return NextResponse.json({
    url: statusUrl.toString(),
    confirmation_code: confirmationCode,
  });
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST with signed_request for Meta data deletion.",
  });
}
