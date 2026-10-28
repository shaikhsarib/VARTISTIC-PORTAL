"use client";

import { useMeta, useTasks } from "@/lib/client/hooks";
import { useViewParams } from "@/lib/client/use-view-params";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, UserCheck } from "lucide-react";

/**
 * Filter bar shared by Board and List views — every control writes to the URL.
 */
export function FiltersBar() {
  const { filters, setFilter, clearFilters } = useViewParams();
  const { data: meta } = useMeta();
  const { data } = useTasks(filters);
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Task filters">
      <Button
        variant={filters.assigneeId === "mine" ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("assigneeId", filters.assigneeId === "mine" ? null : "mine")}
        className="font-bold text-xs shrink-0 h-9"
      >
        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
        {filters.assigneeId === "mine" ? "Showing My Tasks" : "My Tasks"}
      </Button>

      <div className="relative w-full sm:w-60">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" aria-hidden />
        <Input
          value={filters.q ?? ""}
          onChange={(e) => setFilter("q", e.target.value || null)}
          placeholder="Search tasks, keys…"
          className="pl-8 h-9 text-xs sm:text-sm"
          aria-label="Search tasks"
        />
      </div>

      <Select value={filters.status ?? "all"} onValueChange={(v) => setFilter("status", v === "all" ? null : v)}>
        <SelectTrigger className="w-[130px] h-9 text-xs" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority ?? "all"} onValueChange={(v) => setFilter("priority", v === "all" ? null : v)}>
        <SelectTrigger className="w-[125px] h-9 text-xs" aria-label="Filter by priority"><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.assigneeId ?? "all"} onValueChange={(v) => setFilter("assigneeId", v === "all" ? null : v)}>
        <SelectTrigger className="w-[135px] h-9 text-xs" aria-label="Filter by assignee"><SelectValue placeholder="Assignee" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Anyone</SelectItem>
          <SelectItem value="mine">Assigned to me</SelectItem>
          <SelectItem value="none">Unassigned</SelectItem>
          {meta?.users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.labelId ?? "all"} onValueChange={(v) => setFilter("labelId", v === "all" ? null : v)}>
        <SelectTrigger className="w-[125px] h-9 text-xs" aria-label="Filter by label"><SelectValue placeholder="Label" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All labels</SelectItem>
          {meta?.labels.map((l) => (
            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.due ?? "any"} onValueChange={(v) => setFilter("due", v === "any" ? null : v)}>
        <SelectTrigger className="w-[135px] h-9 text-xs" aria-label="Filter by due date"><SelectValue placeholder="Due date" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any date</SelectItem>
          <SelectItem value="1">Due today</SelectItem>
          <SelectItem value="7">Due within 7 days</SelectItem>
          <SelectItem value="30">Due within 30 days</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sort ?? "due"} onValueChange={(v) => setFilter("sort", v)}>
        <SelectTrigger className="w-[130px] h-9 text-xs" aria-label="Sort tasks"><SelectValue placeholder="Sort" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="due">Sort: due date</SelectItem>
          <SelectItem value="created">Sort: newest</SelectItem>
          <SelectItem value="priority">Sort: priority</SelectItem>
          <SelectItem value="title">Sort: title</SelectItem>
        </SelectContent>
      </Select>

      {activeCount > 0 ? (
        <>
          <span className="text-xs font-semibold text-[color:var(--muted-foreground)]" aria-live="polite">
            {data?.count ?? "…"} result{(data?.count ?? 0) === 1 ? "" : "s"}
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" aria-hidden /> Clear
          </Button>
        </>
      ) : null}
    </div>
  );
}
