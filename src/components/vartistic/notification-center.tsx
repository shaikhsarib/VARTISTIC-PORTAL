"use client";

import { useNotifications, useMarkRead } from "@/lib/client/hooks";
import { usePortal } from "@/lib/store/portal";
import { useSound } from "@/hooks/use-sound";
import { Avatar } from "./ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mailbox3D } from "@/components/icons3d/icons";
import { CheckCheck, ArrowRight } from "lucide-react";

const TYPE_META: Record<string, { label: string; color: string }> = {
  ASSIGNED: { label: "Assigned", color: "var(--brand-coral)" },
  MENTION: { label: "Mention", color: "var(--brand-blue)" },
  COMMENT: { label: "Comment", color: "var(--info)" },
  DUE_SOON: { label: "Due soon", color: "var(--brand-yellow)" },
  OVERDUE: { label: "Overdue", color: "var(--destructive)" },
  STATUS_CHANGED: { label: "Status", color: "var(--success)" },
  VERIFIED: { label: "Verified", color: "var(--success)" },
};

/** In-app notification center with read/unread state + live region. */
export function NotificationCenter() {
  const open = usePortal((s) => s.notificationOpen);
  const setOpen = usePortal((s) => s.setNotificationOpen);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const play = useSound();

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) play("whoosh"); }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md" aria-describedby={undefined}>
        <SheetHeader className="border-b p-5 pr-14">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-lg font-extrabold truncate">Notifications</SheetTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold px-2.5 shrink-0"
              onClick={() => markRead.mutate({ all: true })}
              disabled={!data?.unread}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Mark all read
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Your assignments, mentions, comments and due-date reminders.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1" aria-live="polite">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : !data?.notifications.length ? (
            <div className="p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <Mailbox3D size={110} />
                <p className="font-bold">You&apos;re all caught up</p>
                <p className="max-w-[240px] text-sm text-[color:var(--muted-foreground)]">
                  Assignments, mentions, comments and due-date reminders land here.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {data.notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.COMMENT;
                const unread = !n.readAt;
                return (
                  <li key={n.id} className={unread ? "bg-primary/[0.04]" : ""}>
                    <div className="flex gap-3 p-4">
                      {n.actor ? (
                        <Avatar name={n.actor.name} hue={n.actor.avatarHue} size={34} />
                      ) : (
                        <span className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-muted text-sm" aria-hidden>⏰</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-bold" style={{ color: unread ? "var(--foreground)" : "var(--muted-foreground)" }}>
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[11px] text-[color:var(--muted-foreground)]">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="truncate text-xs text-[color:var(--muted-foreground)]">{n.body}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                            style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {unread ? (
                            <button
                              className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                              onClick={() => markRead.mutate({ ids: [n.id] })}
                            >
                              Mark read
                            </button>
                          ) : null}
                          {n.taskId ? (
                            <button
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                              onClick={() => {
                                markRead.mutate({ ids: [n.id] });
                                setOpen(false);
                                window.dispatchEvent(new CustomEvent("vartistic:open-task", { detail: n.taskId }));
                              }}
                            >
                              Open <ArrowRight className="h-3 w-3" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
