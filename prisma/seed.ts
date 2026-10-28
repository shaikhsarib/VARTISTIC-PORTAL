/**
 * Vartistic seed — ports the legacy localStorage roster & board
 * (index.html INITIAL_MEMBERS / INITIAL_TASKS / INITIAL_FEED) into the
 * relational schema, enriched with teams, labels, threads, activity and
 * notifications so every view has meaningful content in local development.
 *
 * Passwords are hashed with the same scrypt helper used by the API.
 * Dev-only credentials are documented in .env.example and the README.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { toISODate } from "../src/lib/domain/streaks";

const db = new PrismaClient();

function dayOffset(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding Vartistic…");

  const passwordHash = await hashPassword("vartistic2026");

  // --- Users (legacy roster preserved; roles expanded per new RBAC model) ---
  const admin = await db.user.upsert({
    where: { email: "admin@vartistic.com" },
    update: {
      username: "admin",
      profileCompleted: true,
      title: "Workspace Administrator",
    },
    create: {
      email: "admin@vartistic.com",
      username: "admin",
      name: "Vartistic Admin",
      passwordHash,
      role: "ADMIN",
      title: "Workspace Administrator",
      profileCompleted: true,
      avatarHue: 20,
      points: 0,
      streak: 0,
      lastActiveDate: "",
    },
  });

  const memberSpec = [
    { key: "ritesh", name: "Ritesh", email: "ritesh@vartistic.com", streak: 4, points: 340, last: -1, hue: 15, github: "ritesh-code", repo: "https://github.com/vartistic/frontend", role: "MEMBER" },
    { key: "sarib", name: "sarib", email: "sarib@vartistic.com", streak: 6, points: 520, last: 0, hue: 210, github: "sarib-dev", repo: "https://github.com/vartistic/api-engine", role: "MANAGER" },
    { key: "owais", name: "owais", email: "owais@vartistic.com", streak: 3, points: 280, last: 0, hue: 45, github: "owais-vartistic", repo: "https://github.com/vartistic/ui-library", role: "MEMBER" },
    { key: "rohit", name: "Rohit", email: "rohit@vartistic.com", streak: 1, points: 140, last: -2, hue: 160, github: null, repo: null, role: "MEMBER" },
    { key: "saniya", name: "saniya", email: "saniya@vartistic.com", streak: 5, points: 460, last: 0, hue: 330, github: "saniya-art", repo: "https://github.com/vartistic/brand-assets", role: "MEMBER" },
  ] as const;

  const users: Record<string, { id: string; name: string }> = { [admin.name]: { id: admin.id, name: admin.name } };
  for (const m of memberSpec) {
    const u = await db.user.upsert({
      where: { email: m.email },
      update: {
        username: m.key,
        profileCompleted: true,
        title: m.role === "MANAGER" ? "Team Lead" : "Creative Member",
      },
      create: {
        email: m.email,
        username: m.key,
        name: m.name,
        passwordHash,
        role: m.role,
        title: m.role === "MANAGER" ? "Team Lead" : "Creative Member",
        profileCompleted: true,
        avatarHue: m.hue,
        points: m.points,
        streak: m.streak,
        lastActiveDate: toISODate(dayOffset(m.last)),
        github: m.github,
        repo: m.repo,
      },
    });
    users[m.name] = { id: u.id, name: u.name };
  }
  const byName = (n: string) => users[n];

  // --- Teams ---
  const design = await db.team.upsert({
    where: { slug: "design" },
    update: {},
    create: { name: "Design Studio", slug: "design" },
  });
  const eng = await db.team.upsert({
    where: { slug: "engineering" },
    update: {},
    create: { name: "Engineering", slug: "engineering" },
  });

  await db.teamMember.deleteMany({ where: { teamId: { in: [design.id, eng.id] } } });
  await db.teamMember.createMany({
    data: [
      { teamId: design.id, userId: byName("saniya").id, isLead: true },
      { teamId: design.id, userId: byName("Ritesh").id, isLead: false },
      { teamId: eng.id, userId: byName("sarib").id, isLead: true },
      { teamId: eng.id, userId: byName("owais").id, isLead: false },
      { teamId: eng.id, userId: byName("Rohit").id, isLead: false },
      { teamId: eng.id, userId: byName("Ritesh").id, isLead: false },
    ],
  });

  // --- Labels ---
  const labelSpec = [
    { name: "Design", color: "coral" },
    { name: "Feature", color: "blue" },
    { name: "Infra", color: "ink" },
    { name: "Research", color: "yellow" },
    { name: "Polish", color: "moss" },
    { name: "Proactive", color: "coral" },
  ];
  const labels: Record<string, string> = {};
  for (const l of labelSpec) {
    const row = await db.label.upsert({ where: { name: l.name }, update: { color: l.color }, create: l });
    labels[l.name] = row.id;
  }

  // --- Tasks (legacy TSK-101..106 preserved) ---
  const taskSpec = [
    {
      key: "TSK-101", title: "Brand Glassmorphic Dashboard Design",
      description: "Construct fluid responsive UI system with deep obsidian background using the Vartistic token palette.",
      status: "IN_PROGRESS", priority: "HIGH", due: 2, assignee: "Ritesh", team: design.id,
      githubLink: "https://github.com/vartistic/frontend/pull/12", attachmentName: "prototype-v1.fig",
      verified: false, isSelfInitiated: false, delayReason: "",
      labels: ["Design", "Feature"],
      commits: [{ hash: "9b71e1", msg: "Built sidebar frosted glass tokens", time: "11:20 AM" }],
      comments: [
        { author: "sarib", body: "Looking sharp — can we keep the glass radius consistent with the token sheet?" },
        { author: "Ritesh", body: "On it @sarib , next commit aligns radius tokens to sm/md/lg." },
      ],
    },
    {
      key: "TSK-102", title: "Persistence Engine & Testing Pipeline",
      description: "Ensure offline resilience and complete the validation matrix ported from testing.py.",
      status: "COMPLETED", priority: "HIGH", due: -1, assignee: "sarib", team: eng.id,
      githubLink: "https://github.com/vartistic/api-engine/commit/a8c71b", attachmentName: "testing-report.pdf",
      verified: true, verifiedBy: "Vartistic Admin", isSelfInitiated: false, delayReason: "",
      labels: ["Infra"],
      commits: [{ hash: "a8c71b", msg: "Zero-regression tests validated", time: "Yesterday" }],
      comments: [{ author: "Vartistic Admin", body: "Verified against the streak + delay-reason matrix. Ship it." }],
    },
    {
      key: "TSK-103", title: "Asset Rendering & SVG Optimization",
      description: "Vectorize creative agency motion graphics and telemetry symbols.",
      status: "COMPLETED", priority: "MEDIUM", due: 1, assignee: "saniya", team: design.id,
      githubLink: "https://github.com/vartistic/brand-assets", attachmentName: "vector-pack.zip",
      verified: false, isSelfInitiated: false, delayReason: "",
      labels: ["Design", "Polish"],
      commits: [{ hash: "3e110d", msg: "Exported dark mode vector symbols", time: "02:15 PM" }],
      comments: [],
    },
    {
      key: "TSK-104", title: "Interactive Micro-chart Canvas Engine",
      description: "Render dynamic distribution charts with smooth transform/opacity animations.",
      status: "IN_PROGRESS", priority: "LOW", due: 3, assignee: "owais", team: eng.id,
      githubLink: "https://github.com/vartistic/ui-library/tree/charts", attachmentName: "canvas-benchmark.zip",
      verified: false, isSelfInitiated: false, delayReason: "",
      labels: ["Feature", "Research"],
      commits: [{ hash: "7c42fa", msg: "Canvas redraw loop optimization", time: "01:40 PM" }],
      comments: [],
    },
    {
      key: "TSK-105", title: "Docker Sync Proxy Setup",
      description: "Setup backend container environment for automated review webhooks.",
      status: "PENDING", priority: "MEDIUM", due: -1, assignee: "Rohit", team: eng.id,
      githubLink: null, attachmentName: null,
      verified: false, isSelfInitiated: false,
      delayReason: "Pending Docker networking certificates on candidate machine.",
      labels: ["Infra"],
      commits: [],
      comments: [{ author: "Rohit", body: "Blocked on gateway credentials — delay reason logged." }],
    },
    {
      key: "EXT-106", title: "Proactive WebGL Particle Backdrop Experiment",
      description: "Self-initiated experiment: high-performance particle canvas for the login backdrop.",
      status: "IN_PROGRESS", priority: "LOW", due: 4, assignee: "Ritesh", team: design.id,
      githubLink: "https://github.com/vartistic/frontend/tree/particles", attachmentName: null,
      verified: false, isSelfInitiated: true, delayReason: "",
      labels: ["Proactive", "Research"],
      commits: [{ hash: "1f90a2", msg: "Particle velocity tuning", time: "04:10 PM" }],
      comments: [],
    },
  ] as const;

  for (const t of taskSpec) {
    const assignee = t.assignee ? byName(t.assignee) : null;
    const verifier = "verifiedBy" in t && t.verifiedBy ? byName(t.verifiedBy) : null;
    const data = {
      key: t.key,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: dayOffset(t.due),
      delayReason: t.delayReason,
      isSelfInitiated: t.isSelfInitiated,
      githubLink: t.githubLink,
      attachmentName: t.attachmentName,
      verified: t.verified,
      verifiedById: verifier ? verifier.id : null,
      verifiedAt: verifier ? new Date(Date.now() - 1000 * 60 * 60 * 5) : null,
      assigneeId: assignee?.id ?? null,
      createdById: verifier ? verifier.id : byName("sarib").id,
      teamId: t.team,
    };
    const task = await db.task.upsert({
      where: { key: t.key },
      update: data,
      create: data,
    });

    // labels
    await db.taskLabel.deleteMany({ where: { taskId: task.id } });
    await db.taskLabel.createMany({
      data: t.labels.map((l) => ({ taskId: task.id, labelId: labels[l] })),
    });

    // commits (structured rows; activity entries mirror them for the timeline)
    await db.commit.deleteMany({ where: { taskId: task.id } });
    for (const c of t.commits) {
      await db.commit.create({
        data: { taskId: task.id, authorId: assignee?.id ?? data.createdById, hash: c.hash, msg: c.msg },
      });
    }
    await db.activity.deleteMany({ where: { taskId: task.id } });
    const acts: { taskId: string; actorId: string | null; type: string; detail: string; createdAt: Date }[] = [
      { taskId: task.id, actorId: data.createdById, type: "CREATED", detail: `created ${t.key}`, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
    ];
    if (assignee) acts.push({ taskId: task.id, actorId: data.createdById, type: "ASSIGNED", detail: `assigned to ${assignee.name}`, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70) });
    for (const c of t.commits) {
      acts.push({ taskId: task.id, actorId: assignee?.id ?? null, type: "COMMIT", detail: `${c.hash} — ${c.msg}`, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) });
    }
    if (t.status === "COMPLETED") {
      acts.push({ taskId: task.id, actorId: assignee?.id ?? null, type: "STATUS_CHANGED", detail: "status: IN_PROGRESS → COMPLETED", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) });
    }
    if (verifier) {
      acts.push({ taskId: task.id, actorId: verifier.id, type: "VERIFIED", detail: `verified by ${verifier.name}`, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) });
    }
    await db.activity.createMany({ data: acts });

    // comments
    await db.comment.deleteMany({ where: { taskId: task.id } });
    for (const c of t.comments ?? []) {
      await db.comment.create({
        data: { taskId: task.id, authorId: byName(c.author).id, body: c.body },
      });
    }
  }

  // --- Standup feed (legacy) ---
  await db.feedPost.deleteMany({});
  await db.feedPost.createMany({
    data: [
      { authorId: byName("sarib").id, type: "Commit", text: "Synchronized commit [a8c71b] on Persistence Engine. All tests verified green.", createdAt: new Date(Date.now() - 1000 * 60 * 90) },
      { authorId: byName("Rohit").id, type: "Blocker", text: "Blocked on Docker gateway credentials for TSK-105. Working on local proxy bypass.", createdAt: new Date(Date.now() - 1000 * 60 * 240) },
      { authorId: byName("Ritesh").id, type: "Progress", text: "Logged extra proactive work: WebGL Particle Backdrop Experiment (+50 XP).", createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    ],
  });

  // --- Notifications sample ---
  await db.notification.deleteMany({});
  await db.notification.createMany({
    data: [
      { userId: byName("Ritesh").id, actorId: byName("sarib").id, type: "COMMENT", title: "sarib commented on TSK-101", body: "Brand Glassmorphic Dashboard Design", taskId: (await db.task.findUnique({ where: { key: "TSK-101" } }))!.id },
      { userId: byName("Rohit").id, actorId: null, type: "OVERDUE", title: "TSK-105 is overdue", body: "Docker Sync Proxy Setup", taskId: (await db.task.findUnique({ where: { key: "TSK-105" } }))!.id },
      { userId: byName("saniya").id, actorId: admin.id, type: "ASSIGNED", title: "Vartistic Admin assigned you TSK-103", body: "Asset Rendering & SVG Optimization", taskId: (await db.task.findUnique({ where: { key: "TSK-103" } }))!.id },
      { userId: byName("sarib").id, actorId: admin.id, type: "VERIFIED", title: "Vartistic Admin verified TSK-102", body: "Persistence Engine & Testing Pipeline", taskId: (await db.task.findUnique({ where: { key: "TSK-102" } }))!.id },
    ],
  });

  console.log("Seed complete: 6 users, 2 teams, 6 labels, 6 tasks, feed + notifications.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
