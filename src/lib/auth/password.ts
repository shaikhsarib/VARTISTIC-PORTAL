/**
 * Password hashing — node:crypto scrypt (no external dependency).
 * Format: scrypt$N$r$p$saltB64$hashB64 — parameters travel with the hash so
 * they can be strengthened later without breaking existing credentials.
 */
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

const PARAMS = { N: 16384, r: 8, p: 1 }; // OWASP-recommended minimum (16MB memory)
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const N = parseInt(nStr, 10);
  const r = parseInt(rStr, 10);
  const p = parseInt(pStr, 10);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = await scrypt(password, salt, expected.length, { N, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
