/**
 * Zod schemas — the single source of truth for boundary validation.
 * SQLite has no native enums, so status/priority/role are validated here.
 */
import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/domain/task-rules";

export const roleSchema = z.enum(["ADMIN", "MANAGER", "MEMBER"]);
export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

export const loginSchema = z
  .object({
    username: z.string().trim().min(2, "Username is required").max(100).optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email").optional(),
    password: z.string().min(1, "Password is required").max(128),
  })
  .refine((d) => Boolean(d.username || d.email), {
    message: "Username or email is required",
    path: ["username"],
  });

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address (e.g. you@gmail.com)"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
  .transform((s) => new Date(s + "T12:00:00")) // midday avoids TZ edge cases
  .refine((d) => !Number.isNaN(d.getTime()), "Due date is not a real calendar date")
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
  description: z.string().trim().max(4000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: dueDateSchema,
  delayReason: z.string().trim().max(1000).optional(),
  isSelfInitiated: z.boolean().optional(),
  githubLink: z.string().trim().max(500).optional(),
  attachmentName: z.string().trim().max(200).optional(),
  assigneeId: z.string().trim().max(64).nullable().optional(),
  teamId: z.string().trim().min(1, "Team is required"),
  labelIds: z.array(z.string().trim().max(64)).max(10).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  description: z.string().trim().max(4000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: dueDateSchema,
  delayReason: z.string().trim().max(1000).optional(),
  isSelfInitiated: z.boolean().optional(),
  githubLink: z.string().trim().max(500).nullable().optional(),
  attachmentName: z.string().trim().max(200).nullable().optional(),
  assigneeId: z.string().trim().max(64).nullable().optional(),
  teamId: z.string().trim().max(64).optional(),
  labelIds: z.array(z.string().trim().max(64)).max(10).optional(),
});

export const commitSchema = z.object({
  hash: z.string().trim().min(4, "Commit hash must be at least 4 characters").max(40)
    .regex(/^[a-zA-Z0-9]+$/, "Commit hash must be alphanumeric"),
  msg: z.string().trim().min(3, "Commit message must be at least 3 characters").max(200),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
  parentId: z.string().trim().max(64).nullable().optional(),
});

export const feedPostSchema = z.object({
  type: z.enum(["Progress", "Commit", "Blocker"]),
  text: z.string().trim().min(3, "Message must be at least 3 characters").max(500),
});

export const readNotificationsSchema = z.object({
  ids: z.array(z.string().trim().max(64)).max(100).optional(),
  all: z.boolean().optional(),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60).optional(),
  title: z.string().trim().max(80).nullable().optional(),
  role: roleSchema.optional(),
  avatarHue: z.number().int().min(0).max(360).optional(),
  profileCompleted: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  github: z.string().trim().max(80).nullable().optional(),
  repo: z.string().trim().max(300).nullable().optional(),
});

export const createUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2, "Username must be at least 2 characters")
      .max(40)
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, or dashes")
      .optional(),
    name: z.string().trim().min(2).max(60).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    role: roleSchema.default("MEMBER"),
    title: z.string().trim().max(80).optional(),
  })
  .refine((d) => Boolean(d.username || d.email), {
    message: "Username is required",
    path: ["username"],
  });

export const updateTeamMemberSchema = z.object({
  userId: z.string().trim().min(1),
  role: roleSchema,
});

/** Search/filter query params for GET /api/v1/tasks. */
export const taskQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().trim().max(64).optional().nullable(),
  teamId: z.string().trim().max(64).optional(),
  labelId: z.string().trim().max(64).optional(),
  dueWithinDays: z.coerce.number().int().min(0).max(365).optional(),
  overdue: z.enum(["true", "false"]).optional(),
  selfInitiated: z.enum(["true", "false"]).optional(),
  mine: z.enum(["true", "false"]).optional(),
  sort: z.enum(["due", "created", "priority", "title"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});
