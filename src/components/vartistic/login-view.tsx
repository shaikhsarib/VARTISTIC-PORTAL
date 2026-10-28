"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LogoLockup } from "./logo";
import { useLogin } from "@/lib/client/hooks";
import { useSound } from "@/hooks/use-sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert3D } from "@/components/icons3d/icons";
import { ShieldAlert, User, Lock, KeyRound } from "lucide-react";

/** Admin-managed credentials login view over the ambient background. */
export function LoginView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const play = useSound();
  const reduced = useReducedMotion();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      await login.mutateAsync({ username: username.trim(), password });
      play("chime");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Check your username and password.");
    }
  }

  function fillDemo(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError(null);
    play("tick");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-md rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-white/10"
      >
        <div className="mb-6 flex justify-center">
          <LogoLockup size={44} height={30} />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Sign in to Vartistic Portal
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the username and password provisioned by your workspace admin.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Username
            </Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, rohit, sarib"
              className="bg-background/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background/60"
            />
          </div>

          {error ? (
            <div role="alert" className="flex items-center gap-3 rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/8 p-3">
              <Alert3D size={36} />
              <p className="text-xs font-medium text-[color:var(--destructive)]">{error}</p>
            </div>
          ) : null}

          <Button type="submit" className="w-full font-bold" disabled={login.isPending}>
            {login.isPending ? "Authenticating…" : "Sign in to Portal"}
          </Button>
        </form>

        {/* Quick Demo Workspace Accounts */}
        <div className="mt-6 rounded-xl border border-border/40 bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground/80 mb-2">
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            Quick Demo Accounts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo("admin", "vartistic2026")}
              className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-[11px] font-medium hover:border-primary transition-colors"
            >
              admin <span className="text-muted-foreground">(Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("sarib", "vartistic2026")}
              className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-[11px] font-medium hover:border-primary transition-colors"
            >
              sarib <span className="text-muted-foreground">(Manager)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("rohit", "vartistic2026")}
              className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-[11px] font-medium hover:border-primary transition-colors"
            >
              rohit <span className="text-muted-foreground">(Member)</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Protected with encrypted scrypt credentials and httpOnly secure sessions.
        </p>
      </motion.div>
    </div>
  );
}
