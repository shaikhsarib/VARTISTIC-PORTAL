import { route } from "@/lib/api/route";
import { recordHeartbeat, getActivePresence } from "@/lib/services/presence";

/**
 * GET /api/v1/presence
 * Returns active online members across the team.
 */
export const GET = route(
  async () => {
    const onlineUsers = getActivePresence();
    return Response.json({
      onlineUsers,
      count: onlineUsers.length,
    });
  },
  { auth: false },
);

/**
 * POST /api/v1/presence
 * Heartbeat registration from active clients with sliding 60s expiration.
 */
export const POST = route(async ({ req, user }) => {
  let currentView: string | undefined;
  try {
    const body = (await req.json()) as { currentView?: string };
    if (body && typeof body.currentView === "string") {
      currentView = body.currentView;
    }
  } catch {
    // Body is optional
  }

  recordHeartbeat({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarHue: user.avatarHue,
    currentView,
  });

  return Response.json({ ok: true });
});

