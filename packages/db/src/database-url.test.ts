import { describe, expect, it } from 'vitest';
import {
  clientConnectionUrl,
  configureDatabaseEnv,
  describePostgresTarget,
  normalizePostgresUrl,
  toDirectPostgresUrl,
} from './database-url';

const pooled =
  'postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

describe('postgres URLs', () => {
  it('requires the postgresql protocol and drops channel binding', () => {
    const normalized = normalizePostgresUrl(pooled);
    const parsed = new URL(normalized);
    expect(parsed.protocol).toBe('postgresql:');
    expect(parsed.searchParams.get('channel_binding')).toBeNull();
    expect(parsed.searchParams.get('sslmode')).toBe('require');
    expect(parsed.searchParams.get('connect_timeout')).toBe('20');
    expect(parsed.searchParams.has('pool_timeout')).toBe(false);
    expect(parsed.password).toBe('PASSWORD');
    const clientUrl = new URL(clientConnectionUrl(pooled));
    expect(clientUrl.searchParams.get('connect_timeout')).toBe('20');
    expect(clientUrl.searchParams.get('pool_timeout')).toBe('20');
    expect(clientUrl.searchParams.get('channel_binding')).toBeNull();
    expect(() => normalizePostgresUrl('mysql://USER:PASSWORD@localhost/neondb')).toThrow(
      /postgresql protocol/,
    );
  });

  it('derives the direct Neon host for migrations', () => {
    const direct = toDirectPostgresUrl(pooled);
    const target = describePostgresTarget(direct);
    expect(target.pooled).toBe(false);
    expect(target.host).toBe('HOST.REGION.aws.neon.tech');
    expect(target.database).toBe('neondb');
    expect(target.region).toBe('REGION');
    expect(direct).not.toContain('channel_binding');
  });

  it('fills DIRECT_URL from the pooled application URL', () => {
    const env: NodeJS.ProcessEnv = { DATABASE_URL: pooled };
    configureDatabaseEnv(env);
    expect(env.DATABASE_URL).not.toContain('channel_binding');
    expect(new URL(env.DIRECT_URL ?? '').hostname).toBe('HOST.REGION.aws.neon.tech');
  });
});
