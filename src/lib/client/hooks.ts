"use client";

/**
 * React Query hooks — the only place the SPA talks to /api/v1.
 * Mutations invalidate affected caches so every view shares one dataset.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client/api";
import type {
  ActivityDTO, CommentDTO, CommitDTO, DashboardDTO, FeedPostDTO,
  MetaDTO, NotificationDTO, SessionUserDTO, TaskDTO, UserDTO,
} from "@/lib/client/types";

export const qk = {
  session: ["session"] as const,
  meta: ["meta"] as const,
  tasks: (params: Record<string, string>) => ["tasks", params] as const,
  task: (id: string) => ["task", id] as const,
  dashboard: ["dashboard"] as const,
  notifications: ["notifications"] as const,
  feed: ["feed"] as const,
  users: ["users"] as const,
  presence: ["presence"] as const,
};

export type OnlineUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarHue: number;
  lastSeen: number;
  currentView?: string;
};

export type TaskFilters = {
  q?: string; status?: string; priority?: string; assigneeId?: string;
  teamId?: string; labelId?: string; due?: string; overdue?: string;
  selfInitiated?: string; mine?: string; sort?: string; dir?: string;
};

function toParams(f: TaskFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) if (v) out[k] = v;
  return out;
}

export function useSession() {
  return useQuery({
    queryKey: qk.session,
    queryFn: () => api<{ user: SessionUserDTO | null; csrfToken: string }>("/api/v1/auth/session"),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username?: string; email?: string; password: string }) =>
      api<{ user: SessionUserDTO; csrfToken: string }>("/api/v1/auth/login", { method: "POST", body }),
    onSuccess: (res) => {
      qc.setQueryData(qk.session, { user: res.user, csrfToken: res.csrfToken });
      void qc.invalidateQueries();
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api<{ user: SessionUserDTO; csrfToken: string }>("/api/v1/auth/signup", { method: "POST", body }),
    onSuccess: (res) => {
      qc.setQueryData(qk.session, { user: res.user, csrfToken: res.csrfToken });
      void qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: true }>("/api/v1/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(qk.session, { user: null, csrfToken: "" });
      qc.clear();
      window.location.href = "/";
    },
  });
}

export function usePresence(currentView?: string) {
  return useQuery({
    queryKey: qk.presence,
    queryFn: async () => {
      // Send lightweight heartbeat to keep self alive in presence pool
      try {
        await api<{ ok: true }>("/api/v1/presence", {
          method: "POST",
          body: { currentView },
        });
      } catch {
        // non-blocking heartbeat
      }
      return api<{ onlineUsers: OnlineUser[]; count: number }>("/api/v1/presence");
    },
    refetchInterval: 10_000, // refresh online users every 10s
    staleTime: 5_000,
  });
}

export function useTasks(filters: TaskFilters) {
  const params = toParams(filters);
  return useQuery({
    queryKey: qk.tasks(params),
    queryFn: () => api<{ tasks: TaskDTO[]; count: number }>(`/api/v1/tasks?${new URLSearchParams(params).toString()}`),
    refetchInterval: 5_000, // live kanban & list sync across all concurrent teammates
  });
}

export function useTaskDetail(id: string | null) {
  return useQuery({
    queryKey: qk.task(id ?? "none"),
    queryFn: () =>
      api<{ task: TaskDTO; comments: CommentDTO[]; activities: ActivityDTO[]; commits: CommitDTO[] }>(
        `/api/v1/tasks/${id}`,
      ),
    enabled: !!id,
  });
}

export function useMeta() {
  return useQuery({ queryKey: qk.meta, queryFn: () => api<MetaDTO>("/api/v1/meta") });
}

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => api<DashboardDTO>("/api/v1/dashboard"),
    refetchInterval: 8_000, // live metrics & delivery stats
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api<{ notifications: NotificationDTO[]; unread: number }>("/api/v1/notifications"),
    refetchInterval: 12_000, // live alert badges
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids?: string[]; all?: boolean }) =>
      api<{ updated: number }>("/api/v1/notifications/read", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useFeed() {
  return useQuery({
    queryKey: qk.feed,
    queryFn: () => api<{ posts: FeedPostDTO[] }>("/api/v1/feed"),
    refetchInterval: 5_000, // live standup feed
  });
}

export function usePostFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; text: string }) =>
      api<{ post: FeedPostDTO }>("/api/v1/feed", { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.feed });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useUsers() {
  return useQuery({ queryKey: qk.users, queryFn: () => api<{ users: UserDTO[] }>("/api/v1/users") });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ task: TaskDTO }>("/api/v1/tasks", { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api<{ task: TaskDTO }>(`/api/v1/tasks/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["task"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      void qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

export function useVerifyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ task: TaskDTO }>(`/api/v1/tasks/${id}/verify`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["task"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      void qc.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useAddCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { hash: string; msg: string } }) =>
      api<{ commit: CommitDTO }>(`/api/v1/tasks/${id}/commits`, { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["task"] });
      void qc.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { body: string; parentId?: string | null } }) =>
      api<{ comment: CommentDTO }>(`/api/v1/tasks/${id}/comments`, { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["task"] });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username?: string; name?: string; email?: string; password: string; role?: string; title?: string }) =>
      api<{ user: UserDTO; credentials: { username: string; password: string; role: string } }>("/api/v1/users", { method: "POST", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.users });
      void qc.invalidateQueries({ queryKey: qk.meta });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name?: string;
      title?: string;
      role?: string;
      avatarHue?: number;
      profileCompleted?: boolean;
      github?: string | null;
      repo?: string | null;
      soundEnabled?: boolean;
    }) => api<{ user: SessionUserDTO }>("/api/v1/me", { method: "PATCH", body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.session });
      void qc.invalidateQueries({ queryKey: qk.users });
    },
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { soundEnabled?: boolean }) =>
      api<{ user: { id: string; soundEnabled: boolean } }>("/api/v1/me", { method: "PATCH", body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.session }),
  });
}
