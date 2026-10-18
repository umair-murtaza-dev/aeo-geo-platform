const POSTGRESQL_PROTOCOL = 'postgresql:';

function parsePostgresqlUrl(value: string, name: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL`);
  }
  if (url.protocol !== POSTGRESQL_PROTOCOL) {
    throw new Error(`${name} must use the postgresql protocol`);
  }
  return url;
}

/**
 * Prisma 6.19.3 does not implement libpq channel binding. Neon console URLs
 * include channel_binding=require, and the query engine then reports that the
 * server cannot be reached. sslmode=require remains.
 */
export function normalizePostgresUrl(value: string, name = 'Database URL'): string {
  const url = parsePostgresqlUrl(value, name);
  url.searchParams.delete('channel_binding');
  // Prisma's default 5s connect timeout reports a cold Neon compute as unreachable.
  if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '20');
  return url.toString();
}

/** Client-only timeouts. Migrations keep the normalized URL without pool settings. */
export function clientConnectionUrl(value: string, name = 'DATABASE_URL'): string {
  const url = parsePostgresqlUrl(normalizePostgresUrl(value, name), name);
  if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '20');
  if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '20');
  return url.toString();
}

export function toDirectPostgresUrl(value: string, name = 'Database URL'): string {
  const url = parsePostgresqlUrl(normalizePostgresUrl(value, name), name);
  url.hostname = url.hostname.replace('-pooler', '');
  return url.toString();
}

export function configureDatabaseEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.DATABASE_URL) {
    env.DATABASE_URL = normalizePostgresUrl(env.DATABASE_URL, 'DATABASE_URL');
  }
  if (env.DIRECT_URL) {
    env.DIRECT_URL = normalizePostgresUrl(env.DIRECT_URL, 'DIRECT_URL');
  } else if (env.DATABASE_URL) {
    env.DIRECT_URL = toDirectPostgresUrl(env.DATABASE_URL, 'DATABASE_URL');
  }
  if (env.TEST_DATABASE_URL) {
    env.TEST_DATABASE_URL = normalizePostgresUrl(env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
  }
}

export function describePostgresTarget(
  value: string,
  name = 'Database URL',
): {
  protocol: string;
  host: string;
  database: string;
  pooled: boolean;
  region: string | null;
  sslmode: string | null;
} {
  const url = parsePostgresqlUrl(normalizePostgresUrl(value, name), name);
  return {
    protocol: url.protocol.slice(0, -1),
    host: url.hostname,
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    pooled: url.hostname.includes('-pooler'),
    region: url.hostname.match(/\.([a-z0-9-]+)\.aws\.neon\.tech$/i)?.[1] ?? null,
    sslmode: url.searchParams.get('sslmode'),
  };
}
