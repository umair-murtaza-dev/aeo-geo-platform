import { PrismaClient } from '@prisma/client';
import { clientConnectionUrl, configureDatabaseEnv } from './database-url';

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  if (!databaseUrl) configureDatabaseEnv();
  const source = databaseUrl ?? process.env.DATABASE_URL;
  const url = source ? clientConnectionUrl(source, 'DATABASE_URL') : undefined;
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: ['error'],
  });
}

let singleton: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  configureDatabaseEnv();
  if (!process.env.DATABASE_URL) return null;
  singleton ??= createPrismaClient();
  return singleton;
}
