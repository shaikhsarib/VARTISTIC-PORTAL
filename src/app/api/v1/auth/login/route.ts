import { NextRequest } from "next/server";
import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie, ensureCsrfCookie } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/auth/login — credentials → httpOnly session cookie.
 * Rate limited per IP+email (10 attempts / 5 min). Generic error message
 * avoids account enumeration. Logs never contain passwords or tokens.
 */
export const POST = route(
  async ({ req }) => {
    const body = zodParse(loginSchema, await req.json());
    const identifier = (body.username || body.email)!.toLowerCase();
    const ip = clientIp(req);
    const limited = rateLimit(`login:${ip}:${identifier}`, 10, 5 * 60 * 1000);
    if (!limited.ok) {
      throw new ApiError("RATE_LIMITED", `Too many attempts. Retry in ${limited.retryAfterSec}s.`);
    }

    const user = (await db.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ] as any,
      },
    })) as any;
    const ok = user ? await verifyPassword(body.password, user.passwordHash) : false;
    if (!user || !ok) {
      logger.warn("auth.login_failed", { ip, identifier });
      throw new ApiError("UNAUTHENTICATED", "Incorrect username or password.");
    }

    const { token, expiresAt } = await createSession(user.id, {
      userAgent: req.headers.get("user-agent"),
      ip,
    });
    await setSessionCookie(token, expiresAt);
    const csrfToken = await ensureCsrfCookie();
    logger.info("auth.login", { userId: user.id, ip });

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        title: user.title,
        profileCompleted: user.profileCompleted,
        avatarHue: user.avatarHue,
        soundEnabled: user.soundEnabled,
        points: user.points,
        streak: user.streak,
        github: user.github,
        repo: user.repo,
      },
      csrfToken,
    });
  },
  { auth: false },
);
