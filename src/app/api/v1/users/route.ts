import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { createUserSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";

/** GET /api/v1/users — directory for filters, assignment and the team view. */
export const GET = route(async () => {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      title: true,
      profileCompleted: true,
      avatarHue: true,
      points: true,
      streak: true,
      lastActiveDate: true,
      github: true,
      repo: true,
      createdAt: true,
    } as any,
    orderBy: [{ points: "desc" }, { name: "asc" }],
  });
  return Response.json({ users });
});

/** POST /api/v1/users — admin-only user creation (provisioning). */
export const POST = route(async ({ req, user }) => {
  if (!canManageUsers(user)) throw new ApiError("FORBIDDEN", "Only admins can create users.");
  const body = zodParse(createUserSchema, await req.json());
  const username = (body.username || body.email?.split("@")[0])!.toLowerCase();
  const email = (body.email || `${username}@vartistic.local`).toLowerCase();

  const exists = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }] as any,
    },
  });
  if (exists) throw new ApiError("CONFLICT", "A user with this username or email already exists.");

  const created = (await db.user.create({
    data: {
      username,
      email,
      name: body.name || username,
      role: body.role ?? "MEMBER",
      title: body.title ?? null,
      profileCompleted: false, // User sets up full profile & role on first login
      passwordHash: await hashPassword(body.password),
      avatarHue: Math.floor(Math.random() * 360),
    } as any,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      title: true,
      avatarHue: true,
      profileCompleted: true,
    } as any,
  })) as any;

  return Response.json(
    {
      user: created,
      credentials: {
        username: created.username,
        password: body.password,
        role: created.role,
      },
    },
    { status: 201 },
  );
});
