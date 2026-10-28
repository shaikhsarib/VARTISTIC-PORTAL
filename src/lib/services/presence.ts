/**
 * In-memory presence registry.
 * Tracks online users across the portal with low latency and zero DB write overhead.
 * Cleans up stale users inactive for > 60 seconds.
 */

export type PresenceUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarHue: number;
  lastSeen: number; // epoch ms
  currentView?: string;
};

// Global singleton registry across fast reloads
const globalForPresence = globalThis as unknown as {
  portalPresence?: Map<string, PresenceUser>;
};

const presenceMap = globalForPresence.portalPresence ?? new Map<string, PresenceUser>();
if (process.env.NODE_ENV !== "production") {
  globalForPresence.portalPresence = presenceMap;
}

const STALE_THRESHOLD_MS = 60_000; // 60s without heartbeat = offline

export function recordHeartbeat(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarHue: number;
  currentView?: string;
}) {
  presenceMap.set(user.id, {
    ...user,
    lastSeen: Date.now(),
  });
}

export function getActivePresence(): PresenceUser[] {
  const now = Date.now();
  const active: PresenceUser[] = [];

  for (const [id, user] of presenceMap.entries()) {
    if (now - user.lastSeen > STALE_THRESHOLD_MS) {
      presenceMap.delete(id);
    } else {
      active.push(user);
    }
  }

  return active.sort((a, b) => b.lastSeen - a.lastSeen);
}

