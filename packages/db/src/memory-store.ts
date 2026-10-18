import { randomUUID } from 'node:crypto';
import { AppError } from '@aeo/shared';
import { hashPassword, verifyPassword } from './password';
import type {
  AuditEntry,
  AuthStore,
  MembershipSummary,
  OrganizationRecord,
  PublicUser,
  WorkspaceRecord,
} from './store';

interface StoredUser extends PublicUser {
  passwordHash: string;
}

export function createMemoryStore(): AuthStore {
  const users = new Map<string, StoredUser>();
  const organizations = new Map<string, OrganizationRecord>();
  const memberships = new Map<string, { organizationId: string; userId: string; role: MembershipSummary['role'] }>();
  const workspaces = new Map<string, WorkspaceRecord>();
  const workspaceMembers: { organizationId: string; workspaceId: string; userId: string }[] = [];
  const audits: AuditEntry[] = [];
  let dummyHash: Promise<string> | null = null;

  function publicUser(user: StoredUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
      createdAt: user.createdAt,
    };
  }

  async function spendDummyHash(password: string): Promise<void> {
    dummyHash ??= hashPassword('not-a-real-user-password');
    await verifyPassword(password, await dummyHash);
  }

  return {
    async ping() {
      return true;
    },
    async createUser(input) {
      const email = input.email.trim().toLowerCase();
      if ([...users.values()].some((user) => user.email === email)) {
        throw new AppError(409, 'CONFLICT', 'An account with this email already exists');
      }
      const user: StoredUser = {
        id: randomUUID(),
        email,
        name: input.name ?? null,
        platformRole: input.platformRole ?? 'NONE',
        passwordHash: await hashPassword(input.password),
        createdAt: new Date(),
      };
      users.set(user.id, user);
      audits.push({
        organizationId: null,
        actorUserId: user.id,
        action: 'user.registered',
        entityType: 'User',
        entityId: user.id,
        metadata: {},
      });
      return publicUser(user);
    },
    async verifyLogin(email, password) {
      const user = [...users.values()].find((candidate) => candidate.email === email.trim().toLowerCase());
      if (!user) {
        await spendDummyHash(password);
        return null;
      }
      const matches = await verifyPassword(password, user.passwordHash);
      if (!matches) return null;
      audits.push({
        organizationId: null,
        actorUserId: user.id,
        action: 'user.logged_in',
        entityType: 'User',
        entityId: user.id,
        metadata: {},
      });
      return publicUser(user);
    },
    async findUserById(id) {
      const user = users.get(id);
      return user ? publicUser(user) : null;
    },
    async createOrganization(input) {
      if (!users.has(input.ownerUserId)) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }
      if ([...organizations.values()].some((organization) => organization.slug === input.slug)) {
        throw new AppError(409, 'CONFLICT', 'Organization slug is already in use');
      }
      const now = new Date();
      const organization: OrganizationRecord = {
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
        kind: input.kind,
        createdAt: now,
        updatedAt: now,
      };
      organizations.set(organization.id, organization);
      memberships.set(`${organization.id}:${input.ownerUserId}`, {
        organizationId: organization.id,
        userId: input.ownerUserId,
        role: 'OWNER',
      });
      const workspaceId = randomUUID();
      workspaces.set(workspaceId, {
        id: workspaceId,
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: now,
        updatedAt: now,
      });
      audits.push({
        organizationId: organization.id,
        actorUserId: input.ownerUserId,
        action: 'organization.created',
        entityType: 'Organization',
        entityId: organization.id,
        metadata: { slug: organization.slug },
      });
      return { ...organization, role: 'OWNER' as const };
    },
    async listMemberships(userId) {
      const results: MembershipSummary[] = [];
      for (const membership of memberships.values()) {
        if (membership.userId !== userId) continue;
        const organization = organizations.get(membership.organizationId);
        if (!organization) continue;
        results.push({
          organizationId: organization.id,
          organizationName: organization.name,
          organizationSlug: organization.slug,
          role: membership.role,
        });
      }
      return results;
    },
    async getOrganizationForUser(userId, organizationId) {
      const membership = memberships.get(`${organizationId}:${userId}`);
      const organization = organizations.get(organizationId);
      if (!membership || !organization) return null;
      return { ...organization, role: membership.role };
    },
    async getOrganizationById(organizationId) {
      return organizations.get(organizationId) ?? null;
    },
    async listWorkspaces(organizationId) {
      return [...workspaces.values()].filter((workspace) => workspace.organizationId === organizationId);
    },
    async listWorkspaceIdsForUser(userId, organizationId) {
      return workspaceMembers
        .filter((membership) => membership.userId === userId && membership.organizationId === organizationId)
        .map((membership) => membership.workspaceId);
    },
    async assignWorkspace(input) {
      const workspace = workspaces.get(input.workspaceId);
      if (!workspace || workspace.organizationId !== input.organizationId) {
        throw new AppError(404, 'NOT_FOUND', 'Workspace not found');
      }
      if (!users.has(input.userId)) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }
      const exists = workspaceMembers.some(
        (membership) => membership.workspaceId === input.workspaceId && membership.userId === input.userId,
      );
      if (!exists) workspaceMembers.push(input);
    },
    async listAuditActionsForActor(actorUserId) {
      return audits.filter((entry) => entry.actorUserId === actorUserId).map((entry) => entry.action);
    },
  };
}
