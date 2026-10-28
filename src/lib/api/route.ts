/**
 * Route wrapper: authentication → CSRF (mutations) → handler, with a
 * consistent error envelope and structured request logging.
 */
import type { NextRequest } from "next/server";
import { getSessionUser, verifyCsrf, type SessionUser } from "@/lib/auth/session";
import { ApiError, jsonError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export type RouteContext = {
  req: NextRequest;
  user: SessionUser;
  params: Record<string, string>;
};

export function route(
  handler: (ctx: RouteContext) => Promise<Response>,
  opts: { auth: boolean; params?: string[] } = { auth: true },
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const started = Date.now();
    const path = new URL(req.url).pathname;
    try {
      const resolvedParams = ctx?.params ? ((await ctx.params) ?? {}) : {};
      const user = await getSessionUser(req);
      if (opts.auth !== false && !user) {
        throw new ApiError("UNAUTHENTICATED", "Sign in to continue.");
      }
      if (user && req.method !== "GET" && req.method !== "HEAD" && !verifyCsrf(req)) {
        throw new ApiError("FORBIDDEN", "Invalid or missing CSRF token.");
      }
      const res = await handler({
        req,
        user: user as SessionUser,
        params: resolvedParams,
      });
      logger.info("api", { path, method: req.method, status: res.status, ms: Date.now() - started, userId: user?.id });
      return res;
    } catch (err) {
      if (!(err instanceof ApiError)) {
        logger.error("api.unhandled", {
          path,
          method: req.method,
          err: err instanceof Error ? { message: err.message } : String(err),
        });
      } else {
        logger.warn("api.rejected", { path, method: req.method, code: err.code, ms: Date.now() - started });
      }
      return jsonError(err);
    }
  };
}

import type { ZodType } from "zod";

export function zodParse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join(".") || "_root",
      message: i.message,
    }));
    throw new ApiError("VALIDATION_ERROR", details[0]?.message ?? "Invalid input", details);
  }
  return result.data;
}
