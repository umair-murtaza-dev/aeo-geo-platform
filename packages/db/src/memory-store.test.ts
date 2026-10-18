import { describe, expect, it } from 'vitest';
import { createMemoryStore } from './memory-store';

describe('memory tenant store', () => {
  it('isolates organizations and records audit actions without secrets', async () => {
    const store = createMemoryStore();
    const owner = await store.createUser({
      email: 'owner@example.com',
      password: 'correct-horse-battery',
      name: 'Owner',
    });
    const other = await store.createUser({
      email: 'other@example.com',
      password: 'correct-horse-battery',
      name: 'Other',
    });
    const organization = await store.createOrganization({
      name: 'Northwind',
      slug: 'northwind',
      kind: 'AGENCY',
      ownerUserId: owner.id,
    });

    expect(await store.getOrganizationForUser(other.id, organization.id)).toBeNull();
    expect((await store.listMemberships(other.id)).map((item) => item.organizationId)).not.toContain(
      organization.id,
    );
    const workspaces = await store.listWorkspaces(organization.id);
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]?.organizationId).toBe(organization.id);

    const actions = await store.listAuditActionsForActor(owner.id);
    expect(actions).toContain('user.registered');
    expect(actions).toContain('organization.created');
    expect(JSON.stringify(actions)).not.toContain('correct-horse');

    expect(await store.verifyLogin('owner@example.com', 'correct-horse-battery')).toMatchObject({
      id: owner.id,
    });
    expect(await store.verifyLogin('owner@example.com', 'wrong-horse-battery-x')).toBeNull();
    expect(await store.verifyLogin('missing@example.com', 'correct-horse-battery')).toBeNull();
  });
});
