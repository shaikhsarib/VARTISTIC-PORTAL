import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlitePragmasSet?: boolean;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_PRISMA === "true" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// High-concurrency SQLite optimization for 10-20+ concurrent active team members:
// - WAL mode enables non-blocking concurrent reads while writes are processing
// - busy_timeout = 5000 gives 5-second automatic queue retry under concurrent write load
// - synchronous = NORMAL reduces disk fsync bottlenecks while preserving full crash safety
if (!globalForPrisma.sqlitePragmasSet) {
  globalForPrisma.sqlitePragmasSet = true;
  void db.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  void db.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
  void db.$queryRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
}