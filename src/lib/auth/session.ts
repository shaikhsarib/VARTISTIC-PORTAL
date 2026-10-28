/**
 * Session management — DB-backed, revocable sessions.
 * Raw token lives only in an httpOnly cookie; only its SHA-256 hash is stored.
 * Expiry + explicit revocation supported. SameSite=Lax + httpOnly + Secure(prod).
 */
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "vartistic_session";
export const CSRF_COOKIE = "vartistic_csrf";
export const CSRF_HEADER = "x-csrf-token";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  name: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
  title: string | null;
  profileCompleted: boolean;
  avatarHue: number;
  soundEnabled: boolean;
  points: number;
  streak: number;
  github: string | null;
  repo: string | null;
  sessionId: string;
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      userAgent: meta.userAgent?.slice(0, 256) ?? null,
      ip: meta.ip?.slice(0, 64) ?? null,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Resolve the current user from the request cookie. Returns null if invalid/expired/revoked. */
export async function getSessionUser(req?: NextRequest): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt < now || (session.revokedAt && session.revokedAt < now)) return null;
  const u = session.user as any;
  if (u.role !== "ADMIN" && u.role !== "MANAGER" && u.role !== "MEMBER") {
    return null;
  }
  return {
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    name: u.name,
    role: u.role as SessionUser["role"],
    title: u.title ?? null,
    profileCompleted: Boolean(u.profileCompleted),
    avatarHue: u.avatarHue,
    soundEnabled: u.soundEnabled,
    points: u.points,
    streak: u.streak,
    github: u.github,
    repo: u.repo,
    sessionId: session.id,
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.session.updateMany({
      where: { tokenHash: hashToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await clearSessionCookie();
}

/** CSRF: double-submit cookie. Mutations must carry X-CSRF-Token matching the cookie. */
export async function ensureCsrfCookie(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = randomBytes(24).toString("base64url");
  store.set(CSRF_COOKIE, token, {
    httpOnly: false, // must be readable by the SPA to echo into the header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export function verifyCsrf(req: NextRequest): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  const cookie = req.cookies.get(CSRF_COOKIE)?.value;
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(header);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
