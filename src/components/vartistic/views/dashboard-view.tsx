"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useDashboard, useFeed, usePostFeed, useTasks } from "@/lib/client/hooks";
import { usePortalUser } from "@/lib/store/user-context";
import { useViewParams } from "@/lib/client/use-view-params";
import { TaskDetailSheet } from "../task-detail-sheet";
import { Avatar, BarRow, DonutChart, PriorityChip, StatusChip, SkeletonBlock } from "../ui";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Send,
  Briefcase,
  CheckCircle2,
  Clock,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  User,
} from "lucide-react";

const FEED_TYPE_BADGES: Record<string, string> = {
  Progress: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Commit: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  Blocker: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function DashboardView() {
  const user = usePortalUser();

  // If user is ADMIN, show Executive Company Dashboard
  // If user is MEMBER/contributor, show their personal Member Workbench
  if (user && user.role !== "ADMIN") {
    return <MemberWorkbench user={user} />;
  }

  return <AdminDashboardView />;
}

/** 1. MEMBER WORKBENCH — Personalized hub for regular team members */
function MemberWorkbench({ user }: { user: NonNullable<ReturnType<typeof usePortalUser>> }) {
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ mine: "true" });
  const { data: feed } = useFeed();
  const postFeed = usePostFeed();
  const { setView } = useViewParams();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [post, setPost] = useState("");
  const [postType, setPostType] = useState<"Progress" | "Commit" | "Blocker">("Progress");

  const myTasks = tasksData?.tasks ?? [];
  const inProgress = myTasks.filter((t) => t.status === "IN_PROGRESS");
  const awaitingVerification = myTasks.filter((t) => t.status === "COMPLETED" && !t.verified);
  const verifiedTasks = myTasks.filter((t) => t.verified);
  const pendingTasks = myTasks.filter((t) => t.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Member Personalized Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background/40 to-background/80 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Briefcase className="h-3.5 w-3.5" /> Member Contributor
              </span>
              <span className="text-xs text-muted-foreground font-mono">@{user.username || user.email?.split("@")[0]}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl text-foreground">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              {user.title ? `${user.title} · ` : ""}Here is your active workbench. Complete tasks and submit your proof of work for admin verification to earn XP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 font-bold text-amber-700 dark:text-amber-300 text-xs">
              <Flame className="h-4 w-4 text-amber-500" />
              <span>{user.streak}-day streak</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-bold text-emerald-700 dark:text-emerald-300 text-xs">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>{user.points} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Task Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Assigned Tasks</p>
          <p className="mt-1 font-mono text-3xl font-extrabold text-foreground">{myTasks.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Assigned to your queue</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">In Progress</p>
          <p className="mt-1 font-mono text-3xl font-extrabold text-blue-600 dark:text-blue-400">{inProgress.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Currently working on</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Awaiting Verification</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1 font-mono text-3xl font-extrabold text-amber-600 dark:text-amber-400">{awaitingVerification.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Proof submitted, waiting for Admin</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified &amp; Approved</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-1 font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{verifiedTasks.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Audited work (+40 XP awarded)</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Work Section: Actionable Tasks */}
        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">My Active Tasks &amp; Proof Submissions</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView("board")} className="text-xs font-semibold">
              View Team Board <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-20" />)}
            </div>
          ) : myTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center bg-card/40">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2 opacity-80" />
              <p className="font-bold text-sm text-foreground">You have no tasks assigned</p>
              <p className="text-xs text-muted-foreground mt-1">Check the Team Board or self-assign a new task to get started.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setOpenTaskId(task.id)}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-4 transition-all hover:border-primary/50 hover:bg-card cursor-pointer shadow-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{task.key}</span>
                      <PriorityChip priority={task.priority} />
                      <StatusChip status={task.status} />
                      {task.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Verified (+40 XP)
                        </span>
                      ) : task.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" /> Proof Submitted · Awaiting Review
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>

                    {task.githubLink && (
                      <p className="text-[11px] text-primary truncate flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 shrink-0" /> Proof: {task.githubLink}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!task.verified && (
                      <Button
                        size="sm"
                        variant={task.status === "COMPLETED" ? "outline" : "default"}
                        className="text-xs font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTaskId(task.id);
                        }}
                      >
                        {task.status === "COMPLETED" ? "View Proof" : "Submit Proof"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Standup Feed & Updates */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Team Standup</h2>

          <div className="rounded-2xl border bg-card/60 p-4 space-y-3 shadow-xs">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!post.trim()) return;
                await postFeed.mutateAsync({ type: postType, text: post.trim() });
                setPost("");
              }}
              className="space-y-2.5"
            >
              <div className="flex gap-1.5">
                {(["Progress", "Commit", "Blocker"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                      postType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <Textarea
                rows={2}
                value={post}
                onChange={(e) => setPost(e.target.value)}
                placeholder="Share your progress or blocker with the team..."
                className="text-xs bg-background"
              />

              <Button type="submit" size="sm" className="w-full text-xs font-bold" disabled={postFeed.isPending}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Post Daily Update
              </Button>
            </form>

            <ul className="space-y-2 pt-2 border-t max-h-72 overflow-y-auto">
              {feed?.posts.slice(0, 6).map((p) => (
                <li key={p.id} className="rounded-lg border border-border/40 bg-background/50 p-2 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground truncate">{p.author.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(p.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed break-words">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <TaskDetailSheet taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}

/** 2. ADMIN EXECUTIVE DASHBOARD — Studio oversight & velocity for Administrators */
function AdminDashboardView() {
  const { data, isLoading } = useDashboard();
  const { data: feed } = useFeed();
  const postFeed = usePostFeed();
  const user = usePortalUser();
  const { setView } = useViewParams();
  const [post, setPost] = useState("");
  const [postType, setPostType] = useState<"Progress" | "Commit" | "Blocker">("Progress");

  if (isLoading || !data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonBlock className="h-72 lg:col-span-2" />
          <SkeletonBlock className="h-72" />
        </div>
      </div>
    );
  }

  const t = data.totals;
  const maxUser = Math.max(...data.perUser.map((u) => u.total), 1);

  return (
    <div className="space-y-6">
      {/* Header hero banner */}
      <div className="glass relative overflow-hidden rounded-2xl p-6 md:p-8 border border-amber-500/20 bg-amber-500/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Workspace Admin Oversight
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl text-foreground">
              Studio Executive Dashboard
            </h1>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              {t.tasks} total tasks tracked · {t.IN_PROGRESS} in progress · {t.unverified} completed awaiting verification.
            </p>
          </div>

          <Button
            onClick={() => setView("admin")}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Open Admin Panel
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active" value={t.IN_PROGRESS} sub="in progress" onClick={() => setView("board")} color="var(--chart-2)" />
        <Metric label="Overdue" value={t.overdue} sub="past due date" onClick={() => setView("list")} color="var(--destructive)" alert={t.overdue > 0} />
        <Metric label="Due soon" value={t.dueSoon} sub="next 48 hours" onClick={() => setView("list")} color="var(--brand-yellow)" />
        <Metric label="Awaiting verify" value={t.unverified} sub="completed · unverified" onClick={() => setView("admin")} color="var(--success)" alert={t.unverified > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Progress + donut */}
        <section className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-foreground">Delivery progress</h2>
              <p className="text-xs text-muted-foreground">Weighted: verified 100% · completed 80% · active 45%</p>
            </div>
            <DonutChart
              centerLabel={`${t.progress}%`}
              centerSub="weighted progress"
              slices={[
                { value: t.COMPLETED, color: "var(--success)", label: "Completed" },
                { value: t.IN_PROGRESS, color: "var(--chart-2)", label: "In progress" },
                { value: t.PENDING, color: "var(--muted-foreground)", label: "Pending" },
              ]}
            />
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Per-user breakdown</h3>
            {data.perUser.map((u) => (
              <BarRow key={u.id} label={u.name} value={u.total} max={maxUser}
                color={u.overdue > 0 ? "var(--destructive)" : "var(--brand-coral)"}
                sub={`${u.completed}/${u.total} done`} />
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Per-team breakdown</h3>
            {data.perTeam.map((tm) => (
              <BarRow key={tm.id} label={tm.name} value={tm.completed} max={Math.max(tm.total, 1)}
                color="var(--brand-blue)" sub={`${tm.completed}/${tm.total} done`} />
            ))}
          </div>
        </section>

        {/* Standup feed */}
        <section className="glass rounded-2xl p-5">
          <h2 className="font-extrabold text-foreground">Studio Standup Feed</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!post.trim()) return;
              await postFeed.mutateAsync({ type: postType, text: post.trim() });
              setPost("");
            }}
            className="mt-3 space-y-2.5"
          >
            <div className="flex gap-1.5">
              {(["Progress", "Commit", "Blocker"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                    postType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <Textarea
              rows={2}
              value={post}
              onChange={(e) => setPost(e.target.value)}
              placeholder="Post team update..."
              className="text-xs"
            />

            <Button type="submit" size="sm" className="w-full text-xs font-bold">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Post Announcement
            </Button>
          </form>

          <ul className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {feed?.posts.slice(0, 6).map((p) => (
              <li key={p.id} className="rounded-lg border border-border/40 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{p.author.name}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(p.createdAt)}</span>
                </div>
                <p className="mt-1 text-muted-foreground text-[11px]">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label, value, sub, color, onClick, alert = false,
}: { label: string; value: number; sub: string; color: string; onClick?: () => void; alert?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button" onClick={onClick} role="listitem"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduced ? undefined : { y: -3 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-2xl p-5 text-left focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
    >
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} aria-hidden />
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label} {alert ? <span aria-hidden> ⚠</span> : null}
      </p>
      <p className="mt-1.5 font-mono text-4xl font-extrabold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </motion.button>
  );
}
