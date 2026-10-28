"use client";

import { useState } from "react";
import { useCreateUser } from "@/lib/client/hooks";
import { usePortalUser } from "@/lib/store/user-context";
import { useSound } from "@/hooks/use-sound";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Copy, Check, ShieldCheck, KeyRound, UserCheck } from "lucide-react";
import type { ApiClientError } from "@/lib/client/api";

export function UserProvisionDialog() {
  const me = usePortalUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
    role: string;
  } | null>(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "MEMBER",
    title: "",
    name: "",
  });

  const create = useCreateUser();
  const play = useSound();

  if (me?.role !== "ADMIN") return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.username.trim() || !form.password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const res = await create.mutateAsync({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        title: form.title.trim() || undefined,
        name: form.name.trim() || form.username.trim(),
      });
      play("chime");
      setCreatedCredentials({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
      });
      setForm({ username: "", password: "", role: "MEMBER", title: "", name: "" });
    } catch (err) {
      const e2 = err as ApiClientError;
      setError(e2.details?.[0]?.message ?? e2.message);
    }
  }

  function copyCredentials() {
    if (!createdCredentials) return;
    const text = `Vartistic Portal Login Credentials:\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    play("tick");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) {
      play("tick");
      setError(null);
      setCreatedCredentials(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-semibold shadow-xs">
          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden /> Provision User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-extrabold text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            Provision Workspace Member
          </DialogTitle>
          <DialogDescription>
            Admin defines the username and password. Give these credentials to the user; they will complete their profile & role on their first login.
          </DialogDescription>
        </DialogHeader>

        {createdCredentials ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                User Created Successfully!
              </div>
              <p className="text-xs text-muted-foreground">
                Copy and share these login credentials securely with the teammate:
              </p>

              <div className="mt-3 space-y-1.5 rounded-lg bg-background/80 p-3 font-mono text-xs border border-border/50 text-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-bold">{createdCredentials.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-bold">{createdCredentials.password}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Role:</span>
                  <span className="font-bold">{createdCredentials.role}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row sm:justify-between gap-2">
              <Button type="button" variant="outline" onClick={copyCredentials} className="flex-1">
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" /> Copy Credentials
                  </>
                )}
              </Button>
              <Button type="button" onClick={() => setOpen(false)} className="flex-1">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-username" className="text-xs font-semibold">
                  Username *
                </Label>
                <Input
                  id="u-username"
                  required
                  autoFocus
                  minLength={2}
                  maxLength={40}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. rohit, alex01"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-pass" className="text-xs font-semibold">
                  Password *
                </Label>
                <Input
                  id="u-pass"
                  type="text"
                  required
                  minLength={6}
                  maxLength={128}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="e.g. pass2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-role" className="text-xs font-semibold">
                  Initial Role
                </Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger id="u-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member (Contributor)</SelectItem>
                    <SelectItem value="MANAGER">Manager (Team Lead)</SelectItem>
                    <SelectItem value="ADMIN">Admin (Full Control)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-title" className="text-xs font-semibold">
                  Designation / Title
                </Label>
                <Input
                  id="u-title"
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. UI/UX Designer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-name" className="text-xs font-semibold">
                Initial Display Name <span className="text-muted-foreground text-[10px]">(optional, user can set this)</span>
              </Label>
              <Input
                id="u-name"
                maxLength={60}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rohit Sharma"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/8 p-3 text-xs font-medium text-[color:var(--destructive)]"
              >
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending} className="font-bold">
                {create.isPending ? "Creating…" : "Create & Provision"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
