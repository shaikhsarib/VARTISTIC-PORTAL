"use client";

/**
 * Session user context — derived from the session query cache (no effect
 * mirroring), consumed via usePortalUser().
 */
import { createContext, useContext } from "react";
import type { SessionUserDTO } from "@/lib/client/types";

export const UserContext = createContext<SessionUserDTO | null>(null);

export function usePortalUser(): SessionUserDTO | null {
  return useContext(UserContext);
}
