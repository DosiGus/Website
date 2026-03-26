import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../lib/logger";
import { decryptToken } from "../../../../lib/security/tokenEncryption";
import { sendInstagramMessage } from "../../../../lib/meta/instagramApi";

/**
 * Maximum number of retry attempts per failed message.
 * After MAX_RETRIES the record is left with resolved_at = null and retry_count = MAX_RETRIES
 * so operators can see it in logs but the cron no longer picks it up.
 */
const MAX_RETRIES = 3;

/**
 * Backoff delays in seconds between retries.
 * Index = retry_count BEFORE the next attempt.
 * [0] = delay before attempt 1 (already enforced via next_retry_at at record creation)
 * [1] = delay after attempt 1 fails, before attempt 2
 * [2] = delay after attempt 2 fails, before attempt 3
 */
const RETRY_BACKOFF_SECONDS = [
  2 * 60,   //  2 min  — initial delay (set at record creation in recordMessageFailure)
  10 * 60,  // 10 min  — after first retry fails
  60 * 60,  //  1 hour — after second retry fails
];

/**
 * Maximum failures processed per cron run.
 * Prevents timeouts on Vercel's 10-second function limit.
 */
const BATCH_SIZE = 50;

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const reqLogger = createRequestLogger("system");

  if (!isAuthorized(request)) {
    await reqLogger.warn("system", "Unauthorized request to message-retry cron");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  // Fetch unresolved retryable failures whose next_retry_at has passed.
  // Partial index on (next_retry_at, retry_count) WHERE retryable=true AND resolved_at IS NULL
  // makes this query fast even with many records.
  const { data: failures, error: fetchError } = await supabase
    .from("message_failures")
    .select("id, integration_id, recipient_id, content, quick_replies, message_type, retry_count")
    .eq("retryable", true)
    .is("resolved_at", null)
    .lt("retry_count", MAX_RETRIES)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    await reqLogger.error("system", `Failed to fetch message failures: ${fetchError.message}`);
    return NextResponse.json({ error: "Failed to fetch failures" }, { status: 500 });
  }

  if (!failures || failures.length === 0) {
    return NextResponse.json({ processed: 0, retried: 0, failed: 0, skipped: 0 });
  }

  await reqLogger.info("system", `Message retry cron: processing ${failures.length} failures`);

  // Cache decrypted tokens per integration to avoid re-fetching for the same integration
  const tokenCache = new Map<string, string | null>();

  let retried = 0;
  let failed = 0;
  let skipped = 0;

  for (const failure of failures) {
    // Skip failures without an integration or recipient — can't send without these
    if (!failure.integration_id || !failure.recipient_id) {
      skipped++;
      continue;
    }

    // Only retry text and quick_reply messages — image URLs may have expired
    if (failure.message_type === "image") {
      skipped++;
      continue;
    }

    // Resolve access token (cached per integration to avoid N+1 queries)
    let accessToken: string | null = null;
    if (tokenCache.has(failure.integration_id)) {
      accessToken = tokenCache.get(failure.integration_id) ?? null;
    } else {
      const { data: integration } = await supabase
        .from("integrations")
        .select("access_token, status")
        .eq("id", failure.integration_id)
        .eq("status", "connected")
        .single();

      if (integration?.access_token) {
        accessToken = decryptToken(integration.access_token);
      }
      tokenCache.set(failure.integration_id, accessToken);
    }

    if (!accessToken) {
      // Integration disconnected or token missing — skip silently, not retryable
      skipped++;
      continue;
    }

    const quickReplies = Array.isArray(failure.quick_replies)
      ? (failure.quick_replies as Array<{ label: string; payload: string }>)
      : [];

    const sendResult = await sendInstagramMessage({
      recipientId: failure.recipient_id,
      text: failure.content ?? "",
      quickReplies,
      accessToken,
    });

    if (sendResult.success) {
      // Mark as resolved — no further retries needed
      await supabase
        .from("message_failures")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", failure.id);

      retried++;

      await reqLogger.info("system", "Message failure retried successfully", {
        metadata: { failureId: failure.id, retryCount: failure.retry_count + 1 },
      });
    } else {
      const newRetryCount = (failure.retry_count ?? 0) + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Exhausted all retries — increment count but leave resolved_at null so it's visible in logs
        await supabase
          .from("message_failures")
          .update({ retry_count: newRetryCount })
          .eq("id", failure.id);

        await reqLogger.warn("system", "Message failure exhausted all retries", {
          metadata: {
            failureId: failure.id,
            attempts: newRetryCount,
            error: sendResult.error,
          },
        });
      } else {
        // Schedule next retry with exponential backoff
        const backoffSeconds = RETRY_BACKOFF_SECONDS[newRetryCount] ?? 60 * 60;
        const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

        await supabase
          .from("message_failures")
          .update({
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt,
          })
          .eq("id", failure.id);

        await reqLogger.warn("system", "Message failure retry failed — scheduled next attempt", {
          metadata: {
            failureId: failure.id,
            newRetryCount,
            nextRetryAt,
            error: sendResult.error,
          },
        });
      }

      failed++;
    }
  }

  await reqLogger.info("system", "Message retry cron completed", {
    metadata: { processed: failures.length, retried, failed, skipped },
  });

  return NextResponse.json({
    processed: failures.length,
    retried,
    failed,
    skipped,
  });
}
