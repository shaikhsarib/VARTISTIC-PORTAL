# Vartistic — internal team task portal

Company-grade task portal for the Vartistic creative ops team: dashboard, kanban
board, list view, threaded comments, activity history, notifications, RBAC
(ADMIN / MANAGER / MEMBER), secure sessions, versioned API, seeded dev data.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite ·
Zustand + TanStack Query · framer-motion · dnd-kit · Vitest

## Quick start

```bash
bun install                 # install dependencies
cp .env.example .env        # configure environment (no secrets needed for dev)
bun run db:push             # create/sync SQLite schema
bun run db:seed             # seed users, teams, labels, tasks, feed, notifications
bun run dev                 # run on http://localhost:3000
```

## Commands

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `bun run dev`        | Dev server (port 3000)                   |
| `bun run lint`       | ESLint                                   |
| `bun run typecheck`  | `tsc --noEmit`                           |
| `bun test`           | Vitest unit suite (domain, RBAC, validation) |
| `bun run db:push`    | Push `prisma/schema.prisma` to SQLite (dev shortcut) |
| `bun run db:migrate` | Create/apply migrations (`prisma/migrations/*`) |
| `bun run db:seed`    | Seed dev data                            |
| `bun run db:reset`   | Drop & re-create (asks for confirmation) |

## Seeded dev accounts

Password for every seeded account: `vartistic2026`

| Email                  | Role    |
| ---------------------- | ------- |
| admin@vartistic.com    | ADMIN   |
| sarib@vartistic.com    | MANAGER |
| ritesh@vartistic.com   | MEMBER  |

## API

Versioned under `/api/v1/*`. Errors always use the envelope
`{ "error": { "code": "...", "message": "..." , "details": [...]? } }`.
Mutations require the `X-CSRF-Token` header echoing the `vartistic_csrf` cookie.
See `src/app/api/v1` for routes; `src/lib/validation/schemas.ts` is the single
source of truth for boundary validation.
