"use client";

import { useState } from "react";
import { usePresence } from "@/lib/client/hooks";
import { Avatar } from "./ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users } from "lucide-react";

export function LivePresenceBadge({ currentView }: { currentView?: string }) {
  const { data } = usePresence(currentView);
  const [open, setOpen] = useState(false);

  const onlineUsers = data?.onlineUsers ?? [];
  const count = data?.count ?? onlineUsers.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/50 bg-background/50 px-2 sm:px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-colors hover:bg-background/80 hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${count} teammate${count === 1 ? "" : "s"} online`}
        >
          {/* Live pulsing green beacon */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-[11px] font-bold text-foreground">
            {count} <span className="hidden xs:inline">{count === 1 ? "live" : "online"}</span>
          </span>

          {/* Overlapping mini avatars (visible on tablet/desktop) */}
          <div className="hidden sm:flex -space-x-1.5 overflow-hidden">
            {onlineUsers.slice(0, 3).map((u) => (
              <span key={u.id} className="inline-block ring-1 ring-background rounded-full">
                <Avatar name={u.name} hue={u.avatarHue} size={18} />
              </span>
            ))}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-3 shadow-lg">
        <div className="flex items-center justify-between border-b pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            Active Team Members
          </div>
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {count} active
          </span>
        </div>

        {onlineUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">No other members online</p>
        ) : (
          <ul className="space-y-1.5 max-h-56 overflow-y-auto">
            {onlineUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-2.5 rounded-lg p-1.5 text-xs hover:bg-muted/50 transition-colors">
                <Avatar name={u.name} hue={u.avatarHue} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {u.role.toLowerCase()} {u.currentView ? `· on ${u.currentView}` : ""}
                  </p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

