import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureDatabaseEnv, describePostgresTarget } from './database-url';

const packageDir = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = resolve(packageDir, '../..');

config({ path: resolve(repoRoot, '.env') });
config({ path: resolve(packageDir, '.env') });
configureDatabaseEnv();

const args = process.argv.slice(2);
const forbidden = /^(reset|--force-reset|drop|truncate)$/i;
if (args.some((arg) => forbidden.test(arg))) {
  console.error('Refusing a command that can reset, drop, or truncate database objects.');
  process.exit(1);
}

if (args[0] === 'migrate' && args[1] === 'deploy') {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error('DIRECT_URL is not set. Migration was not attempted.');
    process.exit(2);
  }
  const target = describePostgresTarget(directUrl, 'DIRECT_URL');
  if (target.pooled) {
    console.error(
      'Refusing to migrate through a pooled host. DIRECT_URL must be the direct Neon host.',
    );
    process.exit(1);
  }
  console.log(
    `migration target host=${target.host} database=${target.database} pooled=${target.pooled}`,
  );
}

const result = spawnSync('pnpm', ['exec', 'prisma', ...args], {
  cwd: packageDir,
  env: process.env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
