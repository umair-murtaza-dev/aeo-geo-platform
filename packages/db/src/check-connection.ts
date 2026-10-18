import { config } from 'dotenv';
import { resolve } from 'node:path';
import { sanitizeErrorMessage } from '@aeo/shared';
import { createPrismaClient } from './client';
import { configureDatabaseEnv, describePostgresTarget } from './database-url';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

function failureReason(message: string): string {
  if (
    /authentication failed|credentials .* are not valid|password authentication failed/i.test(
      message,
    )
  ) {
    return 'authentication';
  }
  if (/can't reach database server|P1001/i.test(message)) {
    return 'unreachable';
  }
  return 'error';
}

async function main(): Promise<number> {
  try {
    configureDatabaseEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid database URL';
    console.error(
      `database_check=failed reason=invalid_url detail=${sanitizeErrorMessage(message)}`,
    );
    return 2;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(
      'DATABASE_URL is not set. Connection was not attempted and no migration was applied.',
    );
    return 2;
  }

  const target = describePostgresTarget(databaseUrl, 'DATABASE_URL');
  const directUrl = process.env.DIRECT_URL;
  const migration = directUrl ? describePostgresTarget(directUrl, 'DIRECT_URL') : null;
  console.log(
    `target protocol=${target.protocol} host=${target.host} database=${target.database} pooled=${target.pooled} region=${target.region ?? 'unknown'} sslmode=${target.sslmode ?? 'unset'}`,
  );
  if (migration) {
    console.log(
      `migration protocol=${migration.protocol} host=${migration.host} database=${migration.database} pooled=${migration.pooled}`,
    );
  }

  const prisma = createPrismaClient(databaseUrl);
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
      console.log(
        'Existing tables were found. Do not apply migrations until ownership is confirmed.',
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(
      `database_check=failed reason=${failureReason(message)} detail=${sanitizeErrorMessage(message)}`,
    );
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
