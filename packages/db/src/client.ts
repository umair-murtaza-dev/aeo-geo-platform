import { PrismaClient } from '@prisma/client';

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: ['error'],
  });
}

let singleton: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  singleton ??= createPrismaClient();
  return singleton;
}
