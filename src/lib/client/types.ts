/**
 * Shared domain types mirrored from the API DTOs (single source: handlers).
 */
export type Role = "ADMIN" | "MANAGER" | "MEMBER";

export type SessionUserDTO = {
  id: string;
  email: string;
  username?: string | null;
  name: string;
  role: Role;
  title?: string | null;
  profileCompleted?: boolean;
  avatarHue: number;
  soundEnabled: boolean;
  points: number;
  streak: number;
  github: string | null;
  repo: string | null;
};

export type UserDTO = {
  id: string;
  name: string;
  username?: string | null;
  role: Role | string;
  title?: string | null;
  profileCompleted?: boolean;
  avatarHue: number;
  email?: string;
  points?: number;
  streak?: number;
  lastActiveDate?: string | null;
  github?: string | null;
  repo?: string | null;
};

export type TaskDTO = {
  id: string;
  key: string;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  overdue: boolean;
  delayReason: string;
  isSelfInitiated: boolean;
  githubLink: string | null;
  attachmentName: string | null;
  verified: boolean;
  verifiedBy: { id: string; name: string } | null;
  verifiedAt: string | null;
  assignee: { id: string; name: string; avatarHue: number; role: string } | null;
  createdBy: { id: string; name: string; avatarHue: number } | null;
  team: { id: string; name: string; slug: string };
  labels: { id: string; name: string; color: string }[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CommentDTO = {
  id: string;
  taskId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatarHue: number };
};

export type ActivityDTO = {
  id: string;
  taskId: string;
  actorId: string | null;
  type: string;
  detail: string;
  createdAt: string;
  actor: { id: string; name: string; avatarHue: number } | null;
};

export type CommitDTO = {
  id: string;
  taskId: string;
  hash: string;
  msg: string;
  createdAt: string;
  author: { id: string; name: string };
};

export type NotificationDTO = {
  id: string;
  userId: string;
  actorId: string | null;
  actor: { id: string; name: string; avatarHue: number } | null;
  type: "ASSIGNED" | "MENTION" | "COMMENT" | "DUE_SOON" | "OVERDUE" | "STATUS_CHANGED" | "VERIFIED";
  title: string;
  body: string;
  taskId: string | null;
  task: { id: string; key: string; title: string } | null;
  readAt: string | null;
  createdAt: string;
};

export type MetaDTO = {
  users: UserDTO[];
  teams: { id: string; name: string; slug: string }[];
  labels: { id: string; name: string; color: string }[];
  ledTeamIds: string[];
};

export type DashboardDTO = {
  totals: {
    tasks: number;
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    overdue: number;
    dueSoon: number;
    unverified: number;
    progress: number;
    today: string;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  perUser: { id: string; name: string; avatarHue: number; total: number; completed: number; inProgress: number; overdue: number }[];
  perTeam: { id: string; name: string; total: number; completed: number }[];
  leaderboard: { id: string; name: string; avatarHue: number; role: string; points: number; streak: number; lastActiveDate: string | null }[];
  dueSoonList: { id: string; key: string; title: string; dueDate: string | null; priority: string }[];
  recentActivity: ActivityDTO[];
};

export type FeedPostDTO = {
  id: string;
  authorId: string;
  type: "Progress" | "Commit" | "Blocker";
  text: string;
  createdAt: string;
  author: { id: string; name: string; avatarHue: number; role: string };
};
