"use client";

import { useEffect, useState } from "react";
import { useAddCommit, useAddComment, useTaskDetail, useUpdateTask, useVerifyTask } from "@/lib/client/hooks";
import { usePortalUser } from "@/lib/store/user-context";
import { useSound } from "@/hooks/use-sound";
import { Avatar, DueChip, LabelChip, PriorityChip, StatusChip } from "./ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BadgeCheck,
  GitCommitHorizontal,
  History,
  MessageSquare,
  Send,
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { ApiClientError } from "@/lib/client/api";

/** Task detail drawer — everything about one task: edit, comments, commits, activity, verification. */
export function TaskDetailSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { data, isLoading } = useTaskDetail(taskId);
  const user = usePortalUser();
  const update = useUpdateTask();
  const verify = useVerifyTask();
  const addComment = useAddComment();
  const addCommit = useAddCommit();
  const play = useSound();

  const [comment, setComment] = useState("");
  const [commit, setCommit] = useState({ hash: "", msg: "" });
  const [delayReason, setDelayReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofSummary, setProofSummary] = useState("");
  const [savingProof, setSavingProof] = useState(false);

  useEffect(() => {
    if (data?.task) {
      setProofUrl(data.task.githubLink ?? "");
      setProofSummary(data.task.attachmentName ?? "");
    }
  }, [data?.task]);

  useEffect(() => {
    function onOpen(e: Event) {
      const id = (e as CustomEvent).detail as string;
      if (id) onClose();
    }
    window.addEventListener("vartistic:open-task", onOpen);
    return () => window.removeEventListener("vartistic:open-task", onOpen);
  }, [onClose]);

  const task = data?.task;
  const canEdit =
    task && user &&
    (user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      task.createdBy?.id === user.id ||
      task.assignee?.id === user.id);
  const canVerify = !task?.verified && task?.status === "COMPLETED" && user && (user.role === "ADMIN" || user.role === "MANAGER");

  async function changeStatus(status: string) {
    if (!task) return;
    setError(null);
    try {
      await update.mutateAsync({
        id: task.id,
        body: { status, delayReason: delayReason ?? undefined },
      });
      play(status === "COMPLETED" ? "chime" : "drop");
    } catch (err) {
      setError((err as ApiClientError).message);
    }
  }

  async function saveDelay() {
    if (!task || delayReason === null) return;
    try {
      await update.mutateAsync({ id: task.id, body: { delayReason } });
      play("pop");
      setDelayReason(null);
    } catch (err) {
      setError((err as ApiClientError).message);
    }
  }

  return (
    <Sheet open={!!taskId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl" aria-describedby={undefined}>
        {isLoading || !task ? (
          <>
            <SheetHeader className="border-b p-5 pb-4 pr-14">
              <SheetTitle className="sr-only">Task details</SheetTitle>
              <SheetDescription className="sr-only">Loading task</SheetDescription>
            </SheetHeader>
            <div className="space-y-3 p-6" aria-busy="true" aria-live="polite">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="border-b p-5 pb-4 pr-14">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--muted-foreground)]">
                <span className="font-mono text-[color:var(--brand-coral)]">{task.key}</span>
                <span>·</span>
                <span>{task.team.name}</span>
                {task.isSelfInitiated ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    +50 XP extra
                  </span>
                ) : null}
                {task.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--success)]/12 px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--success)]">
                    <ShieldCheck className="h-3 w-3" aria-hidden /> Verified{task.verifiedBy ? ` by ${task.verifiedBy.name}` : ""}
                  </span>
                ) : null}
              </div>
              <SheetTitle className="text-xl font-extrabold leading-snug">{task.title}</SheetTitle>
              <SheetDescription className="sr-only">Task details, comments and activity history</SheetDescription>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusChip status={task.status} />
                <PriorityChip priority={task.priority} />
                <DueChip task={task} />
                {task.labels.map((l) => <LabelChip key={l.id} label={l} />)}
              </div>
            </SheetHeader>

            <div className="scroll-slim flex-1 overflow-y-auto p-5" aria-live="polite">
              {error ? (
                <p role="alert" className="mb-4 rounded-lg border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/8 p-3 text-sm font-medium text-[color:var(--destructive)]">
                  {error}
                </p>
              ) : null}

              {/* meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">Assignee</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <Avatar name={task.assignee.name} hue={task.assignee.avatarHue} size={28} />
                        <span className="font-semibold">{task.assignee.name}</span>
                      </>
                    ) : <span className="text-[color:var(--muted-foreground)]">Unassigned</span>}
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">Created by</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {task.createdBy ? (
                      <>
                        <Avatar name={task.createdBy.name} hue={task.createdBy.avatarHue} size={28} />
                        <span className="font-semibold">{task.createdBy.name}</span>
                      </>
                    ) : <span>—</span>}
                  </div>
                </div>
              </div>

              {/* status controls (editable users) */}
              {canEdit && !task.verified ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border p-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">Move to</Label>
                  <Select value={task.status} onValueChange={(v) => changeStatus(v)}>
                    <SelectTrigger className="w-[170px]" aria-label="Change status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed (Awaiting Proof)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Proof of Work & Verification Section */}
              <div className="mt-5 rounded-xl border border-primary/20 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <FileCheck2 className="h-4 w-4 text-primary" />
                    Proof of Completion &amp; Verification
                  </div>
                  {task.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified by Admin (+40 XP)
                    </span>
                  ) : task.status === "COMPLETED" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" /> Awaiting Admin Review
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Required on completion</span>
                  )}
                </div>

                {/* Submitted proof display */}
                {(task.githubLink || task.attachmentName) && (
                  <div className="rounded-lg bg-background/80 p-3 text-xs space-y-2 border border-border/50">
                    {task.githubLink && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground shrink-0">Live Proof / Demo:</span>
                        <a
                          href={task.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-bold text-primary underline truncate hover:text-primary/80"
                        >
                          {task.githubLink}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}
                    {task.attachmentName && (
                      <div>
                        <span className="font-semibold text-muted-foreground">Proof Details:</span>
                        <p className="mt-0.5 text-foreground whitespace-pre-wrap">{task.attachmentName}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form for assignee to submit proof */}
                {canEdit && !task.verified && (
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="proof-url" className="text-xs font-semibold">
                        Proof Link (Live Demo, PR, Figma, or Commit URL)
                      </Label>
                      <Input
                        id="proof-url"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        placeholder="https://my-demo.vercel.app or https://github.com/..."
                        className="text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="proof-summary" className="text-xs font-semibold">
                        Proof Explanation &amp; Test Summary
                      </Label>
                      <Textarea
                        id="proof-summary"
                        rows={2}
                        value={proofSummary}
                        onChange={(e) => setProofSummary(e.target.value)}
                        placeholder="Describe how this task was completed, how to test it, and any deliverables..."
                        className="text-xs bg-background"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="text-xs font-bold"
                        disabled={savingProof}
                        onClick={async () => {
                          setSavingProof(true);
                          try {
                            await update.mutateAsync({
                              id: task.id,
                              body: {
                                githubLink: proofUrl.trim() || null,
                                attachmentName: proofSummary.trim() || null,
                                status: "COMPLETED",
                              },
                            });
                            play("chime");
                          } finally {
                            setSavingProof(false);
                          }
                        }}
                      >
                        {savingProof ? "Submitting…" : "Submit Proof & Mark Completed"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Admin Verification Actions */}
                {canVerify && !task.verified && (
                  <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      onClick={async () => {
                        await verify.mutateAsync(task.id);
                        play("chime");
                      }}
                      disabled={verify.isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve &amp; Verify Task (+40 XP)
                    </Button>
                  </div>
                )}
              </div>

              {/* description */}
              <div className="mt-5">
                <h3 className="text-sm font-bold">Description</h3>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--foreground)]/90">
                  {task.description || <span className="italic text-[color:var(--muted-foreground)]">No description yet.</span>}
                </p>
              </div>

              {/* delay reason (legacy rule surfaced in UI) */}
              {task.overdue || task.delayReason ? (
                <div className="mt-4 rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--brand-yellow)]/10 p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[color:var(--warning)]">Delay reasoning</h3>
                  {delayReason === null ? (
                    <p className="mt-1 text-sm">{task.delayReason || <span className="italic text-[color:var(--destructive)]">Missing — required for overdue work.</span>}</p>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <Input value={delayReason} onChange={(e) => setDelayReason(e.target.value)} placeholder="Why is this blocked/delayed?" aria-label="Delay reason" />
                      <Button size="sm" onClick={saveDelay}>Save</Button>
                    </div>
                  )}
                  {canEdit && task.overdue && !task.delayReason ? (
                    <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => setDelayReason(task.delayReason)}>
                      Add delay reason
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {/* commits tray */}
              <div className="mt-5">
                <h3 className="flex items-center gap-1.5 text-sm font-bold"><GitCommitHorizontal className="h-4 w-4" aria-hidden /> Commits ({data.commits.length})</h3>
                <ul className="mt-2 space-y-1.5">
                  {data.commits.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                      <span className="font-bold text-[color:var(--brand-coral)]">{c.hash}</span>
                      <span className="truncate">{c.msg}</span>
                      <span className="ml-auto shrink-0 text-[color:var(--muted-foreground)]">{c.author.name}</span>
                    </li>
                  ))}
                  {!data.commits.length ? <li className="text-xs italic text-[color:var(--muted-foreground)]">No commits logged.</li> : null}
                </ul>
                {task.assignee?.id === user?.id && !task.verified ? (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await addCommit.mutateAsync({ id: task.id, body: commit });
                        setCommit({ hash: "", msg: "" });
                        play("pop");
                      } catch (err) {
                        setError((err as ApiClientError).details?.[0]?.message ?? (err as ApiClientError).message);
                      }
                    }}
                  >
                    <Input className="w-28 font-mono" placeholder="a1b2c3" maxLength={40} required aria-label="Commit hash"
                      value={commit.hash} onChange={(e) => setCommit((c) => ({ ...c, hash: e.target.value }))} />
                    <Input placeholder="What shipped?" required aria-label="Commit message"
                      value={commit.msg} onChange={(e) => setCommit((c) => ({ ...c, msg: e.target.value }))} />
                    <Button type="submit" size="icon" aria-label="Log commit"><Send className="h-4 w-4" aria-hidden /></Button>
                  </form>
                ) : null}
              </div>

              {/* comments */}
              <div className="mt-5">
                <h3 className="flex items-center gap-1.5 text-sm font-bold"><MessageSquare className="h-4 w-4" aria-hidden /> Comments ({data.comments.length})</h3>
                <ul className="mt-2 space-y-3">
                  {data.comments.map((c) => (
                    <li key={c.id} className={`flex gap-2.5 rounded-xl border p-3 ${c.parentId ? "ml-8" : ""}`}>
                      <Avatar name={c.author.name} hue={c.author.avatarHue} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold">{c.author.name}</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
                        <button
                          className="mt-1 text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                          onClick={() => setComment(`@${c.author.name.split(" ")[0].toLowerCase()} `)}
                        >
                          Reply
                        </button>
                      </div>
                    </li>
                  ))}
                  {!data.comments.length ? <li className="text-xs italic text-[color:var(--muted-foreground)]">Be the first to comment — mention teammates with @name.</li> : null}
                </ul>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!comment.trim()) return;
                    try {
                      await addComment.mutateAsync({ id: task.id, body: { body: comment } });
                      setComment("");
                      play("pop");
                    } catch (err) {
                      setError((err as ApiClientError).message);
                    }
                  }}
                >
                  <Textarea rows={2} placeholder="Write a comment… @mention teammates" aria-label="Write a comment"
                    value={comment} onChange={(e) => setComment(e.target.value)} />
                  <Button type="submit" size="icon" aria-label="Post comment" disabled={addComment.isPending}>
                    <Send className="h-4 w-4" aria-hidden />
                  </Button>
                </form>
              </div>

              {/* activity */}
              <div className="mt-5">
                <h3 className="flex items-center gap-1.5 text-sm font-bold"><History className="h-4 w-4" aria-hidden /> Activity</h3>
                <ol className="mt-2 space-y-2 border-l pl-4">
                  {data.activities.map((a) => (
                    <li key={a.id} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[color:var(--brand-coral)]" aria-hidden />
                      <span className="font-bold">{a.actor?.name ?? "System"}</span>{" "}
                      <span className="text-[color:var(--muted-foreground)]">{a.detail}</span>{" "}
                      <time className="text-[10px] text-[color:var(--muted-foreground)]" dateTime={a.createdAt}>
                        {new Date(a.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </time>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
