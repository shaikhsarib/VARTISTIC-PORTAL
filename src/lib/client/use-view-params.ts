"use client";

/**
 * URL-persisted state — view + task filters live in the query string so any
 * filtered board/list can be shared or bookmarked.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const VIEWS = ["dashboard", "board", "list", "calendar", "team", "admin"] as const;
export type View = (typeof VIEWS)[number];

export const FILTER_KEYS = ["q", "status", "priority", "assigneeId", "teamId", "labelId", "due", "overdue", "selfInitiated", "mine", "sort", "dir"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Filters = Partial<Record<FilterKey, string>>;

export function useViewParams() {
  const router = useRouter();
  const params = useSearchParams();

  const view = (VIEWS.includes(params.get("view") as View) ? params.get("view") : "dashboard") as View;
  const filters: Filters = {};
  for (const k of FILTER_KEYS) {
    const v = params.get(k);
    if (v) filters[k] = v;
  }

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`/?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const setView = useCallback((v: View) => setParams({ view: v }), [setParams]);
  const setFilter = useCallback((k: FilterKey, v: string | null) => setParams({ [k]: v }), [setParams]);
  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    for (const k of FILTER_KEYS) next.delete(k);
    const viewQ = next.get("view");
    router.replace(viewQ ? `/?view=${viewQ}` : "/", { scroll: false });
  }, [params, router]);

  return { view, filters, params, setView, setFilter, setParams, clearFilters };
}
