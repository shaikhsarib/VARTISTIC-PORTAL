"use client";

import { useState } from "react";
import { useCreateTask, useMeta } from "@/lib/client/hooks";
import { usePortalUser } from "@/lib/store/user-context";
import { useSound } from "@/hooks/use-sound";
import { useViewParams } from "@/lib/client/use-view-params";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import type { ApiClientError } from "@/lib/client/api";

function todayISO(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** New task dialog — role-aware defaults (members self-assign; extras get +50 XP). */
export function TaskCreateDialog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: meta } = useMeta();
  const user = usePortalUser();
  const create = useCreateTask();
  const play = useSound();
  const { setFilter } = useViewParams();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: todayISO(3),
    assigneeId: "__self" as string,
    teamId: "",
    delayReason: "",
    isSelfInitiated: false,
  });

  const canPickAssignee = user?.role === "ADMIN" || user?.role === "MANAGER";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        delayReason: form.delayReason || undefined,
        isSelfInitiated: form.isSelfInitiated,
        assigneeId: form.assigneeId === "__self" ? user!.id : form.assigneeId === "__none" ? null : form.assigneeId,
        teamId: form.teamId || meta?.teams[0]?.id,
      });
      play("pop");
      setOpen(false);
      setForm((f) => ({ ...f, title: "", description: "", delayReason: "" }));
      setFilter("status", form.status);
    } catch (err) {
      const e2 = err as ApiClientError;
      setError(e2.details?.[0]?.message ?? e2.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) play("tick"); }}>
      <DialogTrigger asChild>
        {compact ? (
          <Button size="icon" aria-label="Create task">
            <Plus className="h-5 w-5" aria-hidden />
          </Button>
        ) : (
          <Button className="w-full justify-start gap-3" aria-label="Create task">
            <Plus className="h-5 w-5" aria-hidden /> {!compact && <span>New task</span>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-extrabold">Create a task</DialogTitle>
          <DialogDescription>
            {form.isSelfInitiated
              ? "Self-initiated extra work earns +50 XP and must stay assigned to you."
              : "Assign it, set a due date, and it lands on the board instantly."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" required minLength={3} maxLength={140} value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Ship glass tokens for the board view" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={3} maxLength={4000} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Context, links, acceptance criteria…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-team">Team</Label>
              <Select value={form.teamId || meta?.teams[0]?.id || ""} onValueChange={(v) => setForm((f) => ({ ...f, teamId: v }))}>
                <SelectTrigger id="t-team"><SelectValue placeholder="Team" /></SelectTrigger>
                <SelectContent>
                  {meta?.teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-assignee">Assignee</Label>
              <Select value={form.assigneeId} onValueChange={(v) => setForm((f) => ({ ...f, assigneeId: v }))}>
                <SelectTrigger id="t-assignee"><SelectValue placeholder="Assignee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__self">Me ({user?.name})</SelectItem>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {canPickAssignee && meta?.users.filter((u) => u.id !== user?.id).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-priority">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger id="t-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label htmlFor="t-extra" className="font-semibold">Self-initiated extra work</Label>
              <p className="text-xs text-[color:var(--muted-foreground)]">Proactive initiative beyond your board (+50 XP)</p>
            </div>
            <Switch id="t-extra" checked={form.isSelfInitiated}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isSelfInitiated: v }))} />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/8 p-3 text-sm font-medium text-[color:var(--destructive)]">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
