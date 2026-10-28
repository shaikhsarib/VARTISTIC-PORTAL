import { describe, expect, it } from "vitest";
import {
  extractMentions, mentionDrafts, assignedDraft, commentDraft,
  statusChangedDraft, verifiedDraft, dueReminderDraft,
} from "@/lib/domain/notifications";

describe("notification generation", () => {
  const users = [
    { id: "u1", name: "Ritesh" },
    { id: "u2", name: "sarib" },
    { id: "u3", name: "Rohit" },
  ];
  const actor = { id: "u2", name: "sarib" };
  const task = { id: "t1", key: "TSK-101", title: "Brand Glassmorphic Dashboard Design" };

  it("extracts @mentions with word boundaries and case-insensitivity", () => {
    expect(extractMentions("ping @ritesh and @ROHIT please", users.map((u) => u.name)))
      .toEqual(["Ritesh", "Rohit"]);
    expect(extractMentions("email me at ritesh@vartistic.com", users.map((u) => u.name)))
      .toEqual([]); // not a mention (no word start boundary)
    expect(extractMentions("no one here", users.map((u) => u.name))).toEqual([]);
  });

  it("mention drafts skip the actor and map to user ids", () => {
    const drafts = mentionDrafts("thanks @sarib @Ritesh", users, actor, task);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ userId: "u1", type: "MENTION", taskId: "t1" });
  });

  it("assigned draft skips self-assignment", () => {
    expect(assignedDraft("u2", actor, task)).toBeNull();
    const d = assignedDraft("u1", actor, task);
    expect(d).toMatchObject({ userId: "u1", type: "ASSIGNED", title: "sarib assigned you TSK-101" });
  });

  it("comment drafts dedupe recipients and skip the actor", () => {
    const drafts = commentDraft(["u1", "u1", "u2"], actor, task);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].userId).toBe("u1");
  });

  it("status + verified drafts carry readable titles", () => {
    const s = statusChangedDraft(["u1"], actor, task, "PENDING", "IN_PROGRESS");
    expect(s[0].title).toBe("TSK-101 moved PENDING → IN_PROGRESS");
    const v = verifiedDraft(["u1"], { id: "u0", name: "Vartistic Admin" }, task);
    expect(v[0].type).toBe("VERIFIED");
  });

  it("due reminders exist for both kinds", () => {
    expect(dueReminderDraft("u1", task, "DUE_SOON").type).toBe("DUE_SOON");
    expect(dueReminderDraft("u1", task, "OVERDUE").title).toBe("TSK-101 is overdue");
  });
});
