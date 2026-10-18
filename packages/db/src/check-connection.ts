import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';
import { sanitizeErrorMessage } from '@aeo/shared';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

function describeTarget(databaseUrl: string): { host: string; database: string } {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, ''),
  };
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL is not set. Connection was not attempted and no migration was applied.');
    return 2;
  }

  const target = describeTarget(databaseUrl);
  console.log(`target host=${target.host} database=${target.database}`);

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: ['error'] });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`public_table_count=${tables.length}`);
    for (const table of tables) {
      console.log(`table=${table.tablename}`);
    }
    console.log('Read-only check finished. No migration, reset, or write was performed.');
    if (tables.length > 0) {
      console.log('Existing tables were found. Do not apply migrations until ownership is confirmed.');
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`database_check=failed detail=${sanitizeErrorMessage(message)}`);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`database_check=failed detail=${sanitizeErrorMessage(message)}`);
    process.exit(1);
  });
