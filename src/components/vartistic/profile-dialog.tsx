"use client";

/**
 * Profile editor — GitHub identity (username + primary repo) via PATCH /me.
 * Rendered at shell level and controlled by the account menu (a Radix
 * dropdown would unmount a nested dialog, so the trigger lives in the menu
 * and the dialog lives outside it).
 */
import { useState } from "react";
import { usePortalUser } from "@/lib/store/user-context";
import { useUpdateProfile } from "@/lib/client/hooks";
import { useSound } from "@/hooks/use-sound";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      {open ? <ProfileForm onClose={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

/** Mounted fresh per open, so state initializes from the current profile. */
function ProfileForm({ onClose }: { onClose: () => void }) {
  const me = usePortalUser();
  const update = useUpdateProfile();
  const play = useSound();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ github: string; repo: string }>({
    github: me?.github ?? "",
    repo: me?.repo ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({
        github: form.github.trim() || null,
        repo: form.repo.trim() || null,
      });
      play("pop");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-extrabold">GitHub identity</DialogTitle>
          <DialogDescription>
            Linking your account lets teammates find your commits in task trays.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="p-gh">GitHub username</Label>
            <Input id="p-gh" value={form.github} maxLength={80}
              onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))} placeholder="e.g. ritesh-code" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-repo">Primary active repo URL</Label>
            <Input id="p-repo" type="url" value={form.repo} maxLength={300}
              onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))} placeholder="https://github.com/vartistic/frontend" />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/8 p-3 text-sm font-medium text-[color:var(--destructive)]">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
}
