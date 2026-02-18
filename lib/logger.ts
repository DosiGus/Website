import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "./supabaseServerClient";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogSource = "oauth" | "webhook" | "flow" | "api" | "integration" | "system";

interface LogOptions {
  userId?: string | null;
  accountId?: string | null;
  metadata?: Record<string, unknown>;
  requestId?: string;
  durationMs?: number;
}

interface LogEntry {
  level: LogLevel;
  source: LogSource;
  message: string;
  user_id?: string | null;
  account_id?: string | null;
  metadata: Record<string, unknown>;
  request_id?: string;
  duration_ms?: number;
}

const REDACTED_VALUE = "[REDACTED]";
const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /token/i,
  /secret/i,
  /password/i,
  /^code$/i,
  /^state$/i,
  /signed_request/i,
  /email/i,
  /phone/i,
  /^messageText$/i,
  /^message_text$/i,
  /^content$/i,
  /^quickReplyPayload$/i,
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function redactMetadata(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return REDACTED_VALUE;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactMetadata(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        result[key] = REDACTED_VALUE;
      } else {
        result[key] = redactMetadata(entryValue, depth + 1);
      }
    }
    return result;
  }
  return value;
}

class Logger {
  private requestId: string | null = null;
  private source: LogSource = "system";
  private userId: string | null = null;
  private accountId: string | null = null;
  private startTime: number | null = null;

  withContext(options: {
    requestId?: string;
    source?: LogSource;
    userId?: string | null;
    accountId?: string | null;
  }): Logger {
    const logger = new Logger();
    logger.requestId = options.requestId || randomUUID();
    logger.source = options.source || this.source;
    logger.userId = options.userId ?? this.userId;
    logger.accountId = options.accountId ?? this.accountId;
    logger.startTime = Date.now();
    return logger;
  }

  setAccountId(accountId: string | null): void {
    this.accountId = accountId;
  }

  startTimer(): void {
    this.startTime = Date.now();
  }

  private getElapsedMs(): number | undefined {
    return this.startTime ? Date.now() - this.startTime : undefined;
  }

  private async writeLog(
    level: LogLevel,
    source: LogSource,
    message: string,
    options: LogOptions = {},
  ): Promise<void> {
    const rawMetadata = {
      ...options.metadata,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };
    const sanitizedMetadata = redactMetadata(rawMetadata);
    const metadata =
      sanitizedMetadata && typeof sanitizedMetadata === "object" && !Array.isArray(sanitizedMetadata)
        ? (sanitizedMetadata as Record<string, unknown>)
        : {};

    const entry: LogEntry = {
      level,
      source,
      message,
      user_id: options.userId ?? this.userId ?? undefined,
      account_id: options.accountId ?? this.accountId ?? undefined,
      metadata,
      request_id: options.requestId ?? this.requestId ?? undefined,
      duration_ms: options.durationMs ?? this.getElapsedMs(),
    };

    const consoleMsg = `[${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;
    switch (level) {
      case "debug":
        console.debug(consoleMsg, entry.metadata);
        break;
      case "info":
        console.info(consoleMsg, entry.metadata);
        break;
      case "warn":
        console.warn(consoleMsg, entry.metadata);
        break;
      case "error":
        console.error(consoleMsg, entry.metadata);
        break;
    }

    try {
      const dbEnabled = process.env.LOG_DB_ENABLED !== "false";
      if (!dbEnabled) {
        return;
      }
      const sampleRateRaw = Number.parseFloat(process.env.LOG_DB_SAMPLE_RATE ?? "1");
      const sampleRate = Number.isFinite(sampleRateRaw) ? sampleRateRaw : 1;
      if (sampleRate < 1 && Math.random() > sampleRate) {
        return;
      }
      const supabaseAdmin = createSupabaseServerClient();
      await supabaseAdmin.from("logs").insert(entry);
    } catch (err) {
      console.error("Failed to write log to database:", err);
    }
  }

  async debug(source: LogSource, message: string, options?: LogOptions): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      await this.writeLog("debug", source, message, options);
    } else {
      console.debug(`[DEBUG] [${source}] ${message}`, options?.metadata);
    }
  }

  async info(source: LogSource, message: string, options?: LogOptions): Promise<void> {
    await this.writeLog("info", source, message, options);
  }

  async warn(source: LogSource, message: string, options?: LogOptions): Promise<void> {
    await this.writeLog("warn", source, message, options);
  }

  async error(source: LogSource, message: string, options?: LogOptions): Promise<void> {
    await this.writeLog("error", source, message, options);
  }

  async logError(
    source: LogSource,
    error: unknown,
    context?: string,
    options?: LogOptions,
  ): Promise<void> {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    await this.writeLog("error", source, context ? `${context}: ${errorObj.message}` : errorObj.message, {
      ...options,
      metadata: {
        ...options?.metadata,
        errorName: errorObj.name,
        errorStack: errorObj.stack,
        errorMessage: errorObj.message,
      },
    });
  }

  async trackOperation<T>(
    source: LogSource,
    operationName: string,
    operation: () => Promise<T>,
    options?: LogOptions,
  ): Promise<T> {
    const opRequestId = options?.requestId ?? randomUUID();
    const startTime = Date.now();

    await this.info(source, `${operationName} started`, {
      ...options,
      requestId: opRequestId,
    });

    try {
      const result = await operation();
      const durationMs = Date.now() - startTime;

      await this.info(source, `${operationName} completed`, {
        ...options,
        requestId: opRequestId,
        durationMs,
        metadata: {
          ...options?.metadata,
          success: true,
        },
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      await this.logError(source, error, `${operationName} failed`, {
        ...options,
        requestId: opRequestId,
        durationMs,
      });

      throw error;
    }
  }
}

export const logger = new Logger();

export function createRequestLogger(
  source: LogSource,
  userId?: string | null,
  accountId?: string | null,
) {
  return logger.withContext({
    requestId: randomUUID(),
    source,
    userId,
    accountId,
  });
}
