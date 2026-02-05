import { NextResponse } from "next/server";
import crypto from "crypto";
import { createRequestLogger } from "../../../../lib/logger";

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
  const statusUrl = new URL("/data-deletion", request.url);
  statusUrl.searchParams.set("code", confirmationCode);

  await reqLogger.info("oauth", "Data deletion request received", {
    metadata: {
      userId: payload.user_id ?? null,
      issuedAt: payload.issued_at ?? null,
      confirmationCode,
    },
  });

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
