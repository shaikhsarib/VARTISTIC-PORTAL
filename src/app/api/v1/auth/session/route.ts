import { route } from "@/lib/api/route";
import { getSessionUser, ensureCsrfCookie } from "@/lib/auth/session";

/**
 * GET /api/v1/auth/session — current user + CSRF token (issues the cookie on
 * first visit so every later mutation can echo it).
 */
export const GET = route(
  async ({ user }) => {
    const csrfToken = await ensureCsrfCookie();
    return Response.json({ user, csrfToken });
  },
  { auth: false },
);
