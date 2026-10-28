"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useDashboard, useUsers } from "@/lib/client/hooks";
import { usePortalUser } from "@/lib/store/user-context";
import { UserProvisionDialog } from "../user-provision-dialog";
import { Avatar, EmptyState } from "../ui";
import { User3D } from "@/components/icons3d/icons";

/** Team directory — roles, workload, streaks and XP (legacy gamification kept). */
export function TeamView() {
  const { data: dash } = useDashboard();
  const { data: usersData } = useUsers();
  const me = usePortalUser();
  const reduced = useReducedMotion();

  const users = usersData?.users ?? [];
  const workload = new Map(dash?.perUser.map((u) => [u.id, u]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Team</h1>
          <p className="text-sm text-[color:var(--muted-foreground)]">Workload, streaks and roles across the studio.</p>
        </div>
        <UserProvisionDialog />
      </div>

      {!users.length ? (
        <EmptyState icon={<User3D size={110} />} title="No teammates yet" hint="Admins can provision accounts from the API." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Team members">
          {users.map((u, i) => {
            const load = workload.get(u.id);
            const isMe = u.id === me?.id;
            return (
              <motion.li
                key={u.id}
                role="listitem"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
                className={`glass rounded-2xl p-5 ${isMe ? "ring-2 ring-[color:var(--brand-coral)]/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} hue={u.avatarHue} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {u.name} {isMe ? <span className="text-xs font-semibold text-[color:var(--brand-coral)]">(you)</span> : null}
                    </p>
                    <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                      @{u.username || u.email?.split("@")[0]} {u.title ? `· ${u.title}` : ""}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                    style={{
                      background: u.role === "ADMIN" ? "color-mix(in srgb, var(--brand-ink) 10%, transparent)" : u.role === "MANAGER" ? "color-mix(in srgb, var(--brand-blue) 12%, transparent)" : "var(--muted)",
                      color: u.role === "ADMIN" ? "var(--foreground)" : u.role === "MANAGER" ? "var(--info)" : "var(--muted-foreground)",
                    }}
                  >
                    {u.role}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/60 p-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-foreground)]">Tasks</dt>
                    <dd className="font-mono text-lg font-extrabold">{load?.total ?? 0}</dd>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-foreground)]">Streak</dt>
                    <dd className="font-mono text-lg font-extrabold text-[color:var(--warning)]">{u.streak ?? 0}🔥</dd>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-foreground)]">XP</dt>
                    <dd className="font-mono text-lg font-extrabold text-[color:var(--brand-coral)]">{u.points ?? 0}</dd>
                  </div>
                </dl>

                {load && load.overdue > 0 ? (
                  <p className="mt-3 rounded-lg bg-[color:var(--destructive)]/8 px-3 py-1.5 text-xs font-semibold text-[color:var(--destructive)]">
                    ⚠ {load.overdue} overdue task{load.overdue === 1 ? "" : "s"}
                  </p>
                ) : null}

                {u.github ? (
                  <p className="mt-3 truncate text-xs">
                    <span className="text-[color:var(--muted-foreground)]">GitHub:</span>{" "}
                    <a
                      href={`https://github.com/${u.github}`}
                      className="font-semibold underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      @{u.github}
                    </a>
                  </p>
                ) : null}
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
