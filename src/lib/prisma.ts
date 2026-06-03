/**
 * Prisma Client Singleton
 *
 * Ensures a single PrismaClient instance across hot-reloads in development.
 * Prisma 6 reads DATABASE_URL from environment automatically.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}