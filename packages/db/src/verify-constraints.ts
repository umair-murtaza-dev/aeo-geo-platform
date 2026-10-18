import { config } from 'dotenv';
import { resolve } from 'node:path';
import { sanitizeErrorMessage } from '@aeo/shared';
import { createPrismaClient } from './client';
import { configureDatabaseEnv } from './database-url';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });
configureDatabaseEnv();

async function main(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not set. Constraint verification was not attempted.');
    return 2;
  }

  const prisma = createPrismaClient();
  try {
    const foreignKeys = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'
    `;
    const checks = await prisma.$queryRaw<Array<{ conname: string; table_name: string; definition: string }>>`
      SELECT conname, conrelid::regclass::text AS table_name, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE contype = 'c' AND connamespace = 'public'::regnamespace
      ORDER BY conname
    `;
    const primaryDomain = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'brand_domains'
        AND indexdef ILIKE '%is_primary%'
    `;
    const mention = checks.find((row) => row.conname === 'brand_mentions_single_target_chk');
    const fkCount = Number(foreignKeys[0]?.count ?? 0);
    console.log(`foreign_key_count=${fkCount}`);
    console.log(`check_constraint_count=${checks.length}`);
    console.log(
      `brand_mentions_single_target_chk=${mention ? 'present' : 'missing'}`,
    );
    console.log(`brand_domains_primary_partial_index=${primaryDomain.length > 0 ? 'present' : 'missing'}`);
    if (!mention || primaryDomain.length === 0 || fkCount < 1) {
      console.error('constraint_verification=failed');
      return 1;
    }
    console.log('constraint_verification=passed');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`constraint_verification=failed detail=${sanitizeErrorMessage(message)}`);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`constraint_verification=failed detail=${sanitizeErrorMessage(message)}`);
    process.exit(1);
  });
