import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const TOKEN_PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
let warnedMissingKey = false;

function loadEncryptionKey(): Buffer {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY fehlt.");
  }

  const key = Buffer.from(rawKey, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("TOKEN_ENCRYPTION_KEY muss 32 bytes base64 sein.");
  }

  return key;
}

export function isEncryptedToken(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith(TOKEN_PREFIX);
}

export function encryptToken(value: string): string {
  if (!value) return value;
  if (isEncryptedToken(value)) return value;
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TOKEN_ENCRYPTION_KEY missing in production.");
    }
    if (!warnedMissingKey) {
      console.warn("TOKEN_ENCRYPTION_KEY missing; storing token in plaintext.");
      warnedMissingKey = true;
    }
    return value;
  }

  const key = loadEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${TOKEN_PREFIX}${payload}`;
}

export function decryptToken(value?: string | null): string | null {
  if (!value) return null;
  if (!isEncryptedToken(value)) return value;

  const key = loadEncryptionKey();
  const payload = Buffer.from(value.slice(TOKEN_PREFIX.length), "base64");
  if (payload.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Token-Format ungultig.");
  }

  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = payload.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
