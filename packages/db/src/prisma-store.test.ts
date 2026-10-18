import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { clientConnectionUrl, configureDatabaseEnv } from './database-url';
import { createPrismaStore } from './prisma-store';

configureDatabaseEnv();
const testDatabaseUrl = process.env.TEST_DATABASE_URL
  ? clientConnectionUrl(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL')
  : undefined;
const rollback = new Error('ROLLBACK_TEST');

function assertSafeTestDatabase(url: string): void {
  const host = new URL(url).hostname;
  const allowed =
    host === 'localhost' || host === '127.0.0.1' || process.env.ALLOW_REMOTE_TEST_DATABASE === '1';
  if (!allowed) {
    throw new Error(
      `Refusing database tests against host ${host}. Use a local disposable database or set ALLOW_REMOTE_TEST_DATABASE=1 for a dedicated database.`,
    );
  }
}

describe('prisma store', () => {
  const prisma = testDatabaseUrl
    ? new PrismaClient({ datasources: { db: { url: testDatabaseUrl } }, log: ['error'] })
    : null;

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it.skipIf(!testDatabaseUrl)(
    'creates a user and organization inside a transaction that rolls back',
    async () => {
      if (!testDatabaseUrl || !prisma) return;
      assertSafeTestDatabase(testDatabaseUrl);
      await expect(createPrismaStore(prisma).ping()).resolves.toBe(true);

      try {
        await prisma.$transaction(
          async (tx) => {
            const store = createPrismaStore(tx as unknown as PrismaClient);
            const user = await store.createUser({
              email: `m01-${crypto.randomUUID()}@example.com`,
              password: 'correct-horse-battery',
              name: 'M01',
            });
            const organization = await store.createOrganization({
              name: 'M01 Test',
              slug: `m01-${crypto.randomUUID().slice(0, 8)}`,
              kind: 'BUSINESS',
              ownerUserId: user.id,
            });
            expect(await store.getOrganizationForUser(user.id, organization.id)).toMatchObject({
              role: 'OWNER',
            });
            expect(await store.listWorkspaces(organization.id)).toHaveLength(1);
            expect(await store.verifyLogin(user.email, 'correct-horse-battery')).toMatchObject({
              id: user.id,
            });
            expect(await store.verifyLogin(user.email, 'wrong-password-value')).toBeNull();

            const outsider = await store.createUser({
              email: `outsider-${crypto.randomUUID()}@example.com`,
              password: 'correct-horse-battery',
              name: 'Outsider',
            });
            expect(await store.getOrganizationForUser(outsider.id, organization.id)).toBeNull();
            expect(await store.listMemberships(outsider.id)).toEqual([]);
            throw rollback;
          },
          { maxWait: 15_000, timeout: 60_000 },
        );
      } catch (error) {
        if (error !== rollback) throw error;
      }
    },
  );
});
