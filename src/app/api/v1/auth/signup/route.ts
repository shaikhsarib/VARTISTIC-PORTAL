import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { signupSchema } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie, ensureCsrfCookie } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/auth/signup — public self-serve registration.
 * Allows teammates to register with real Gmail or company email addresses.
 * Hashes password via scrypt and logs in immediately with an httpOnly session.
 */
export const POST = route(
  async ({ req }) => {
    const body = zodParse(signupSchema, await req.json());
    const ip = clientIp(req);

    // Rate limit signup attempts to prevent abuse
    const limited = rateLimit(`signup:${ip}`, 5, 10 * 60 * 1000);
    if (!limited.ok) {
      throw new ApiError("RATE_LIMITED", `Too many attempts. Retry in ${limited.retryAfterSec}s.`);
    }

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new ApiError("CONFLICT", "An account with this email already exists. Please sign in instead.");
    }

    // Deterministic avatar hue from name
    let hash = 0;
    for (let i = 0; i < body.name.length; i++) {
      hash = (hash << 5) - hash + body.name.charCodeAt(i);
      hash |= 0;
    }
    const avatarHue = Math.abs(hash) % 360;

    const passwordHash = await hashPassword(body.password);

    const user = (await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        avatarHue,
        role: "MEMBER",
      } as any,
    })) as any;

    const { token, expiresAt } = await createSession(user.id, {
      userAgent: req.headers.get("user-agent"),
      ip,
    });

    await setSessionCookie(token, expiresAt);
    const csrfToken = await ensureCsrfCookie();
    logger.info("auth.signup", { userId: user.id, email: user.email, ip });

    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarHue: user.avatarHue,
          soundEnabled: user.soundEnabled,
          points: user.points,
          streak: user.streak,
          github: user.github,
          repo: user.repo,
        },
        csrfToken,
      },
      { status: 201 }
    );
  },
  { auth: false }
);

