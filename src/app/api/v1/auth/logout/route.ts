import { route } from "@/lib/api/route";
import { revokeCurrentSession } from "@/lib/auth/session";

/** POST /api/v1/auth/logout — revokes the session server-side and clears the cookie. */
export const POST = route(
  async () => {
    await revokeCurrentSession();
    return Response.json({ ok: true });
  },
  { auth: false },
);
