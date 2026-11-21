import { createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing — scrypt with a per-password salt.
 * Format: scrypt$N$r$p$<salt b64>$<hash b64>
 * scrypt ships with Node, so there is no native build step on ARM/Android.
 */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const derived = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacSha256(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Cryptographically-random integer in [min, max]. */
export function secureInt(min: number, max: number): number {
  return randomInt(min, max + 1);
}

/** Human-friendly code: XXXX-XXXX, crypto-random, unambiguous alphabet. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function humanCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[secureInt(0, CODE_ALPHABET.length - 1)];
  return length === 8 ? `${out.slice(0, 4)}-${out.slice(4)}` : out;
}

/** Weighted random selection used by the daily spin. */
export function weightedPick<T extends { weight: number }>(items: T[]): T | null {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0 || items.length === 0) return null;
  let roll = secureInt(1, total);
  for (const item of items) {
    roll -= Math.max(0, item.weight);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/** Short, readable reference like KIB-7F3A2C. */
export function reference(prefix: string): string {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
