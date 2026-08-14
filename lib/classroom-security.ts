import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type EncryptedEnvelope = { version: 1; iv: string; tag: string; data: string };

export function classroomSecret() {
  return process.env.CLASSROOM_SECRET || process.env.ADMIN_SESSION_SECRET || "";
}

export function classroomConfigured() {
  return Boolean(classroomSecret() && process.env.BLOB_READ_WRITE_TOKEN);
}

function encryptionKey() {
  return createHash("sha256").update(`szhato-classroom:${classroomSecret()}`).digest();
}

export function encryptClassroomRecord(value: unknown) {
  if (!classroomSecret()) throw new Error("Секрет кабинета не настроен.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const envelope: EncryptedEnvelope = {
    version: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    data: encrypted.toString("base64url"),
  };
  return JSON.stringify(envelope);
}

export function decryptClassroomRecord<T>(payload: string): T | null {
  try {
    const envelope = JSON.parse(payload) as EncryptedEnvelope;
    if (envelope.version !== 1) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(envelope.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64url")), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function normalizeStudentCode(value: string) {
  return value.toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, "");
}

export function studentCodeLookup(value: string) {
  return createHmac("sha256", classroomSecret()).update(`student-code:${normalizeStudentCode(value)}`).digest("hex");
}

export function signClassroomValue(value: string) {
  return createHmac("sha256", classroomSecret()).update(value).digest("base64url");
}

export function safeClassroomEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
