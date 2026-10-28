"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { usePortal } from "@/lib/store/portal";
import { usePortalUser } from "@/lib/store/user-context";
import { useLogout, useNotifications, useSession, useUpdateMe } from "@/lib/client/hooks";
import { useViewParams, type View } from "@/lib/client/use-view-params";
import { useSound } from "@/hooks/use-sound";
import { LogoMark, LogoWordmark } from "./logo";
import { Avatar } from "./ui";
import { NotificationCenter } from "./notification-center";
import { LivePresenceBadge } from "./live-presence";
import { ProfileDialog } from "./profile-dialog";
import { ProfileSetupDialog } from "./profile-setup-dialog";
import { TaskCreateDialog } from "./task-create-dialog";
import { DashboardView } from "./views/dashboard-view";
import { BoardView } from "./views/board-view";
import { ListView } from "./views/list-view";
import { CalendarView } from "./views/calendar-view";
import { TeamView } from "./views/team-view";
import { AdminView } from "./views/admin-view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Columns3, ListChecks, CalendarDays, Users, PanelLeftClose, PanelLeftOpen,
  Bell, LogOut, Moon, Sun, Volume2, VolumeX, Plus, Search, Github, UserCheck, ShieldCheck, Briefcase,
} from "lucide-react";

const NAV: { view: View; label: string; icon: React.ElementType }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "board", label: "Board", icon: Columns3 },
  { view: "list", label: "List", icon: ListChecks },
  { view: "calendar", label: "Calendar", icon: CalendarDays },
  { view: "team", label: "Team", icon: Users },
];

export function AppShell() {
  const { view, filters, setView, setParams } = useViewParams();
  const user = usePortalUser();
  const collapsed = usePortal((s) => s.sidebarCollapsed);
  const toggleSidebar = usePortal((s) => s.toggleSidebar);
  const soundEnabled = usePortal((s) => s.soundEnabled);
  const setSoundEnabled = usePortal((s) => s.setSoundEnabled);
  const setNotificationOpen = usePortal((s) => s.setNotificationOpen);
  const { data: notif } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const logout = useLogout();
  const updateMe = useUpdateMe();
  const { refetch } = useSession();
  const play = useSound();
  const { theme, setTheme } = useTheme();

  // sync persisted sound preference from the server profile once per session
  const soundSynced = useRef(false);
  useEffect(() => {
    if (user && !soundSynced.current) {
      soundSynced.current = true;
      const stored = window.localStorage.getItem("vartistic.sound.enabled");
      if (stored === null) setSoundEnabled(user.soundEnabled);
    }
  }, [user, setSoundEnabled]);

  // keyboard shortcut: "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = notif?.unread ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div className="flex flex-1">
        {/* --- Sidebar ------------------------------------------------------ */}
        <aside
          aria-label="Primary"
          className={`glass sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r py-5 transition-all duration-300 md:flex ${
            collapsed ? "w-[76px]" : "w-64"
          }`}
        >
          <div className={`flex items-center gap-2 px-4 ${collapsed ? "justify-center px-0" : ""}`}>
            <LogoMark size={34} title="Vartistic home" />
            {!collapsed && <LogoWordmark height={22} />}
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-1.5 px-3" aria-label="Main navigation">
            {(user?.role === "ADMIN"
              ? [
                  { view: "dashboard" as View, label: "Studio Dashboard", icon: LayoutDashboard },
                  { view: "admin" as View, label: "Admin Panel", icon: ShieldCheck },
                  { view: "board" as View, label: "Team Board", icon: Columns3 },
                  { view: "list" as View, label: "All Tasks", icon: ListChecks },
                  { view: "calendar" as View, label: "Calendar", icon: CalendarDays },
                  { view: "team" as View, label: "Team Members", icon: Users },
                ]
              : [
                  { view: "dashboard" as View, label: "My Workbench", icon: Briefcase },
                  { view: "board" as View, label: "Team Board", icon: Columns3 },
                  { view: "list" as View, label: "My Tasks & Backlog", icon: ListChecks },
                  { view: "calendar" as View, label: "Calendar", icon: CalendarDays },
                  { view: "team" as View, label: "Team Directory", icon: Users },
                ]
            ).map((item) => {
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => { setView(item.view); play("tick"); }}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-[color:var(--muted-foreground)] hover:bg-muted hover:text-foreground"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.view === "admin" && (
                    <span className="ml-auto rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
                      ADMIN
                    </span>
                  )}
                  {!collapsed && item.view === "board" && filters.status ? (
                    <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      filtered
                    </span>
                  ) : null}
                </button>
              );
            })}

            <div className={collapsed ? "mt-2 flex justify-center" : "mt-2 px-1"}>
              <TaskCreateDialog compact={collapsed} />
            </div>
          </nav>

          <div className="px-3">
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[color:var(--muted-foreground)] hover:bg-muted hover:text-foreground"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
              {!collapsed && "Collapse"}
            </button>
          </div>
        </aside>

        {/* --- Main column --------------------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 border-b px-3 sm:px-4 md:px-6" role="banner">
            <div className="flex items-center gap-2 md:hidden">
              <LogoMark size={28} />
            </div>

            <div className="relative w-full max-w-[140px] xs:max-w-[190px] sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" aria-hidden />
              <Input
                id="global-search"
                value={filters.q ?? ""}
                onChange={(e) => { setParams({ q: e.target.value || null, view: view === "dashboard" ? "list" : view }); }}
                onKeyDown={(e) => { if (e.key === "Enter") setParams({ view: "list" }); }}
                placeholder="Search… (/)"
                className="pl-8 text-xs sm:text-sm h-9"
                aria-label="Search tasks globally"
              />
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {/* Distinct Role Indicator Badge */}
              {user?.role === "ADMIN" ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Workspace Admin
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Briefcase className="h-3.5 w-3.5" /> Member Workbench
                </span>
              )}

              <LivePresenceBadge currentView={view} />

              <Button
                variant="ghost" size="icon"
                className="hidden sm:inline-flex"
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
              </Button>

              <Button
                variant="ghost" size="icon"
                className="hidden sm:inline-flex"
                aria-label={soundEnabled ? "Mute sound cues" : "Enable sound cues"}
                aria-pressed={soundEnabled}
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  void updateMe.mutateAsync({ soundEnabled: next });
                  if (next) setTimeout(() => play("pop"), 60);
                }}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
              </Button>

              <Button
                variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                onClick={() => setNotificationOpen(true)}
              >
                <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden />
                {unread > 0 ? (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-[color:var(--brand-coral)] px-1 text-[10px] font-bold text-white"
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Button>

              <TaskCreateDialog compact />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-0.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" aria-label="Account menu">
                    <Avatar name={user?.name ?? "?"} hue={user?.avatarHue ?? 0} size={32} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-bold">{user?.name}</div>
                    <div className="text-xs font-normal text-[color:var(--muted-foreground)]">{user?.email}</div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--brand-coral)]">
                      {user?.role} · {user?.points} XP · {user?.streak}-day streak
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); setSetupOpen(true); }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" aria-hidden /> Edit Profile &amp; Role
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); setProfileOpen(true); }}
                  >
                    <Github className="mr-2 h-4 w-4" aria-hidden /> Edit GitHub profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? <Sun className="mr-2 h-4 w-4" aria-hidden /> : <Moon className="mr-2 h-4 w-4" aria-hidden />}
                    Toggle theme
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      void updateMe.mutateAsync({ soundEnabled: next });
                    }}
                  >
                    {soundEnabled ? <Volume2 className="mr-2 h-4 w-4" aria-hidden /> : <VolumeX className="mr-2 h-4 w-4" aria-hidden />}
                    Sound cues {soundEnabled ? "on" : "off"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { logout.mutate(); void refetch(); }}
                    className="text-[color:var(--destructive)]"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main id="main-content" className="flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 md:px-6 md:pb-6" role="main">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {view === "dashboard" && <DashboardView />}
                {view === "board" && <BoardView />}
                {view === "list" && <ListView />}
                {view === "calendar" && <CalendarView />}
                {view === "team" && <TeamView />}
                {view === "admin" && <AdminView />}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="mt-auto border-t px-4 py-4 pb-24 md:pb-4 md:px-6" role="contentinfo">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--muted-foreground)]">
              <p className="flex items-center gap-1.5">
                <LogoMark size={16} /> <span className="font-semibold">Vartistic</span> — internal team task portal
              </p>
              <p>
                API v1 ·{" "}
                <Link href="/?view=board" className="underline-offset-2 hover:underline">Board</Link>
                {" · "}
                <Link href="/?view=list" className="underline-offset-2 hover:underline">List</Link>
                {" · "}
                <span aria-hidden>· sessions encrypted &amp; revocable</span>
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* --- Mobile bottom navigation bar (fixed for phone viewports) --- */}
      <nav
        aria-label="Mobile Navigation"
        className="glass fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 px-1 backdrop-blur-lg md:hidden"
      >
        {(user?.role === "ADMIN"
          ? [
              { view: "dashboard" as View, label: "Studio", icon: LayoutDashboard },
              { view: "admin" as View, label: "Admin", icon: ShieldCheck, isAdmin: true },
              { view: "board" as View, label: "Board", icon: Columns3 },
              { view: "list" as View, label: "Tasks", icon: ListChecks },
              { view: "calendar" as View, label: "Calendar", icon: CalendarDays },
              { view: "team" as View, label: "Team", icon: Users },
            ]
          : [
              { view: "dashboard" as View, label: "Workbench", icon: Briefcase },
              { view: "board" as View, label: "Board", icon: Columns3 },
              { view: "list" as View, label: "Tasks", icon: ListChecks },
              { view: "calendar" as View, label: "Calendar", icon: CalendarDays },
              { view: "team" as View, label: "Team", icon: Users },
            ]
        ).map((item) => {
          const active = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => { setView(item.view); play("tick"); }}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-bold transition-all ${
                active
                  ? "isAdmin" in item && item.isAdmin
                    ? "text-amber-600 dark:text-amber-400 font-extrabold"
                    : "text-primary font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} aria-hidden />
                {"isAdmin" in item && item.isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] leading-tight">{item.label}</span>
              {active && (
                <span
                  className={`absolute top-0 h-0.5 w-6 rounded-full ${
                    "isAdmin" in item && item.isAdmin ? "bg-amber-500" : "bg-primary"
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      <NotificationCenter />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ProfileSetupDialog forceOpen={setupOpen} onClose={() => setSetupOpen(false)} />
    </div>
  );
}

function usePortalSafe() {
  const user = usePortalUser();
  return { user };
}
