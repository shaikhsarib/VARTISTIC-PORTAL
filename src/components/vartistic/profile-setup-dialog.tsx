"use client";

import { useState } from "react";
import { usePortalUser } from "@/lib/store/user-context";
import { useUpdateProfile } from "@/lib/client/hooks";
import { useSound } from "@/hooks/use-sound";
import { Avatar } from "./ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Sparkles, Check, Palette, Briefcase, User } from "lucide-react";

const AVATAR_HUE_PRESETS = [
  { label: "Coral", hue: 15, bg: "bg-[#ff5b3a]" },
  { label: "Amber", hue: 45, bg: "bg-[#ffc531]" },
  { label: "Emerald", hue: 150, bg: "bg-[#10b981]" },
  { label: "Blue", hue: 215, bg: "bg-[#2b59ff]" },
  { label: "Purple", hue: 275, bg: "bg-[#a855f7]" },
  { label: "Rose", hue: 340, bg: "bg-[#f43f5e]" },
];

export function ProfileSetupDialog({
  forceOpen,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const me = usePortalUser();
  const update = useUpdateProfile();
  const play = useSound();

  // If profile is not completed yet, show automatically
  const shouldShow = forceOpen || (me && me.profileCompleted === false);

  const [name, setName] = useState(me?.name ?? "");
  const [title, setTitle] = useState(me?.title ?? "");
  const [role, setRole] = useState(me?.role ?? "MEMBER");
  const [avatarHue, setAvatarHue] = useState(me?.avatarHue ?? 210);
  const [github, setGithub] = useState(me?.github ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!shouldShow || !me) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter your display name.");
      return;
    }

    try {
      await update.mutateAsync({
        name: name.trim(),
        title: title.trim() || undefined,
        role,
        avatarHue,
        github: github.trim() || null,
        profileCompleted: true,
      });
      play("chime");
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    }
  }

  return (
    <Dialog open={true} onOpenChange={(v) => { if (!v && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Create Your Profile & Role
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Welcome to Vartistic Portal! Complete your name, team role, and custom avatar to finalize your workspace presence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
          {/* Live Avatar Preview & Hue Selector */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar name={name || me.name || "User"} hue={avatarHue} size={56} />
              <span
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-background shadow-xs"
                style={{ backgroundColor: `hsl(${avatarHue}, 80%, 50%)` }}
              >
                <Palette className="h-2.5 w-2.5 text-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Choose Avatar Color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATAR_HUE_PRESETS.map((p) => (
                  <button
                    key={p.hue}
                    type="button"
                    onClick={() => { setAvatarHue(p.hue); play("tick"); }}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${p.bg} ${
                      avatarHue === p.hue ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80"
                    }`}
                    title={p.label}
                  >
                    {avatarHue === p.hue && <Check className="h-3 w-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setup-name" className="text-xs font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Full Name / Display Name *
            </Label>
            <Input
              id="setup-name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rohit Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="setup-title" className="text-xs font-semibold flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Role / Designation
              </Label>
              <Input
                id="setup-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. UI/UX Designer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup-role" className="text-xs font-semibold">
                Access Tier
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger id="setup-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member (Contributor)</SelectItem>
                  <SelectItem value="MANAGER">Manager (Team Lead)</SelectItem>
                  {me.role === "ADMIN" && <SelectItem value="ADMIN">Admin (Full Control)</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setup-github" className="text-xs font-semibold">
              GitHub Profile <span className="text-muted-foreground text-[10px]">(optional)</span>
            </Label>
            <Input
              id="setup-github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="e.g. rohit-dev"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/8 p-2.5 text-xs font-medium text-[color:var(--destructive)]">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={update.isPending} className="w-full font-bold">
              {update.isPending ? "Saving Profile…" : "Save Profile & Enter Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

