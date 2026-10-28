"use client";

import { useState } from "react";
import { useTasks, useUsers, useVerifyTask, useUpdateTask, useDashboard } from "@/lib/client/hooks";
import { usePortalUser } from "@/lib/store/user-context";
import { useSound } from "@/hooks/use-sound";
import { UserProvisionDialog } from "../user-provision-dialog";
import { Avatar, PriorityChip, StatusChip } from "../ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  UserPlus,
  Users,
  Award,
  Clock,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

export function AdminView() {
  const me = usePortalUser();
  const play = useSound();
  const [activeTab, setActiveTab] = useState<"verification" | "users" | "analytics">("verification");

  // Fetch all completed tasks to review proof of work
  const { data: completedTasksData, refetch: refetchTasks } = useTasks({ status: "COMPLETED" });
  const { data: usersData } = useUsers();
  const { data: dashboardData } = useDashboard();

  const verifyTask = useVerifyTask();
  const updateTask = useUpdateTask();

  const allCompleted = completedTasksData?.tasks ?? [];
  const pendingVerification = allCompleted.filter((t) => !t.verified);
  const verifiedTasks = allCompleted.filter((t) => t.verified);
  const users = usersData?.users ?? [];

  if (me?.role !== "ADMIN") {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center p-6">
        <div className="max-w-md space-y-3">
          <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            This administration panel is restricted to workspace administrators. Members can view and submit proof for their assigned tasks in the Board and List views.
          </p>
        </div>
      </div>
    );
  }

  async function handleApprove(taskId: string) {
    try {
      await verifyTask.mutateAsync(taskId);
      play("chime");
      void refetchTasks();
    } catch {
      // Handled by toast / error boundary
    }
  }

  async function handleRequestChanges(taskId: string) {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        body: { status: "IN_PROGRESS" },
      });
      play("pop");
      void refetchTasks();
    } catch {
      // Handled by toast / error boundary
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Admin Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Admin Command Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Review submitted proof of work, verify completed tasks (+40 XP), and provision workspace member credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UserProvisionDialog />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => { setActiveTab("verification"); play("tick"); }}
          className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "verification"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          Proof Review Queue
          {pendingVerification.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
              {pendingVerification.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("users"); play("tick"); }}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Member Provisioning &amp; Roles ({users.length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("analytics"); play("tick"); }}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === "analytics"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          Verification Audit
        </button>
      </div>

      {/* Tab 1: Verification Queue */}
      {activeTab === "verification" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Tasks Awaiting Proof Verification ({pendingVerification.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Review assignee proof links and details before awarding points
            </span>
          </div>

          {pendingVerification.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-foreground">All Tasks Verified!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                There are currently no tasks awaiting proof review. When members submit work proof, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingVerification.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {task.key}
                        </span>
                        <PriorityChip priority={task.priority} />
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          Proof Submitted
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 sm:flex-initial text-xs"
                        onClick={() => handleApprove(task.id)}
                        disabled={verifyTask.isPending}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Approve &amp; Verify (+40 XP)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-initial text-xs"
                        onClick={() => handleRequestChanges(task.id)}
                        disabled={updateTask.isPending}
                      >
                        <RotateCcw className="mr-1.5 h-4 w-4 text-muted-foreground" />
                        Request Changes
                      </Button>
                    </div>
                  </div>

                  {/* Proof Details Card */}
                  <div className="mt-4 rounded-xl border border-primary/20 bg-muted/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Submitted by:</span>
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Avatar name={task.assignee.name} hue={task.assignee.avatarHue} size={20} />
                            <span>{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </div>

                      {task.dueDate && (
                        <span className="text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Proof Link */}
                    {task.githubLink ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-foreground shrink-0">Proof Link:</span>
                        <a
                          href={task.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary underline truncate hover:text-primary/80"
                        >
                          {task.githubLink}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">
                        No external proof link attached.
                      </p>
                    )}

                    {/* Proof Description / Notes */}
                    {task.attachmentName && (
                      <div className="text-xs pt-1 border-t border-border/40">
                        <span className="font-bold text-foreground">Proof Summary:</span>
                        <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                          {task.attachmentName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Provisioning & Roles */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Workspace Team Members ({users.length})
            </h2>
            <UserProvisionDialog />
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground uppercase font-semibold text-[10px] border-b">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">XP Points</th>
                    <th className="px-4 py-3">Streak</th>
                    <th className="px-4 py-3">Profile Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} hue={u.avatarHue} size={30} />
                          <div>
                            <p className="font-bold text-foreground">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        @{u.username || u.email?.split("@")[0]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            u.role === "ADMIN"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              : u.role === "MANAGER"
                              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.title || "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">
                        {u.points ?? 0} XP
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {u.streak ?? 0} days
                      </td>
                      <td className="px-4 py-3">
                        {u.profileCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" /> Pending Setup
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Verification Audit */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            Audit Log of Verified Tasks ({verifiedTasks.length})
          </h2>

          <div className="grid gap-3">
            {verifiedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{t.key}</span>
                    <span className="font-bold text-foreground text-sm">{t.title}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Assignee: {t.assignee?.name ?? "None"} · Team: {t.team?.name}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Verified (+40 XP)
                  </span>
                  {t.verifiedAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(t.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

