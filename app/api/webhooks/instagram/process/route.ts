import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createRequestLogger } from "../../../../../lib/logger";
import type { InstagramWebhookPayload } from "../../../../../lib/meta/types";
import { processInstagramWebhookPayload } from "../route";

const handler = async (request: Request) => {
  const reqLogger = createRequestLogger("webhook");

  try {
    const payload = (await request.json()) as InstagramWebhookPayload;
    const baseUrl = new URL(request.url).origin;
    await processInstagramWebhookPayload(payload, reqLogger, baseUrl);
    return NextResponse.json({ received: true });
  } catch (error) {
    await reqLogger.logError("webhook", error, "Queued webhook processing failed");
    return NextResponse.json({ received: false }, { status: 500 });
  }
};

const hasQstashKeys = Boolean(
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
);

export const POST = hasQstashKeys
  ? verifySignatureAppRouter(handler)
  : async () => {
      const reqLogger = createRequestLogger("webhook");
      await reqLogger.error(
        "webhook",
        "QStash signing keys fehlen, Verarbeitung verweigert",
      );
      return NextResponse.json(
        { error: "QStash signing keys fehlen" },
        { status: 500 },
      );
    };
