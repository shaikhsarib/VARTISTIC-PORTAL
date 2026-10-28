import { describe, expect, it } from "vitest";
import { sanitizeText, safeExternalUrl } from "@/lib/domain/sanitize";
import { loginSchema, createTaskSchema, commitSchema, taskQuerySchema } from "@/lib/validation/schemas";
import { buildTaskWhere } from "@/lib/services/tasks";

describe("input sanitization", () => {
  it("strips all HTML tags from user text (XSS defense in depth)", () => {
    expect(sanitizeText('<script>alert(1)</script>hello')).toBe("hello");
    expect(sanitizeText("<b>bold</b> text")).toBe("bold text");
    expect(sanitizeText('"><img src=x onerror=alert(1)>')).toBe('">');
  });
});

describe("URL allow-listing", () => {
  it("accepts http(s) and rejects javascript:/data: and garbage", () => {
    expect(safeExternalUrl("https://github.com/vartistic")).toContain("github.com");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
  });
});

describe("boundary validation (zod)", () => {
  it("login rejects bad email and empty password", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "A@B.CO", password: "x" }).success).toBe(true);
  });

  it("createTask rejects short titles and unknown statuses/priorities", () => {
    const base = { title: "Valid title", teamId: "team-1" };
    expect(createTaskSchema.safeParse(base).success).toBe(true);
    expect(createTaskSchema.safeParse({ ...base, title: "ab" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...base, status: "DONE" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...base, priority: "URGENT" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...base, dueDate: "2026-13-77" }).success).toBe(false);
  });

  it("commit rejects non-alphanumeric or short hashes", () => {
    expect(commitSchema.safeParse({ hash: "9b71e1", msg: "built tokens" }).success).toBe(true);
    expect(commitSchema.safeParse({ hash: "ab", msg: "built tokens" }).success).toBe(false);
    expect(commitSchema.safeParse({ hash: "drop table", msg: "built tokens" }).success).toBe(false);
  });

  it("task query rejects bogus enum params and coerces numbers", () => {
    expect(taskQuerySchema.safeParse({ status: "LATER" }).success).toBe(false);
    expect(taskQuerySchema.safeParse({ dueWithinDays: "7" }).success).toBe(true);
    const ok = taskQuerySchema.parse({ dueWithinDays: "7" });
    expect(ok.dueWithinDays).toBe(7);
  });
});

describe("filter → WHERE builder (URL-persisted filter semantics)", () => {
  const viewer = { id: "u1" };

  it("maps search across title/description/key", () => {
    const where = buildTaskWhere({ q: "glass" }, viewer);
    expect(where.OR).toEqual([
      { title: { contains: "glass" } },
      { description: { contains: "glass" } },
      { key: { contains: "glass" } },
    ]);
  });

  it("maps mine / unassigned / self-initiated / status", () => {
    expect(buildTaskWhere({ mine: "true" }, viewer).assigneeId).toBe("u1");
    expect(buildTaskWhere({ assigneeId: "none" }, viewer).assigneeId).toBeNull();
    expect(buildTaskWhere({ assigneeId: "u2" }, viewer).assigneeId).toBe("u2");
    expect(buildTaskWhere({ selfInitiated: "true" }, viewer).isSelfInitiated).toBe(true);
    expect(buildTaskWhere({ status: "COMPLETED" }, viewer).status).toBe("COMPLETED");
  });

  it("overdue filter means due before today and not completed", () => {
    const where = buildTaskWhere({ overdue: "true" }, viewer);
    expect(where.status).toEqual({ not: "COMPLETED" });
    expect((where.dueDate as { lt: Date }).lt).toBeInstanceOf(Date);
  });

  it("label filter uses the join table", () => {
    expect(buildTaskWhere({ labelId: "lbl1" }, viewer).labels).toEqual({ some: { labelId: "lbl1" } });
  });
});
