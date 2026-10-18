import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '@aeo/shared';
import { hashPassword, verifyPassword } from './password';
import type { AuthStore, MembershipSummary, OrganizationRecord, PublicUser } from './store';

function toPublicUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  platformRole: PublicUser['platformRole'];
  createdAt: Date;
}): PublicUser {
  if (!user.email) {
    throw new AppError(500, 'INTERNAL_ERROR', 'User record is missing an email');
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    platformRole: user.platformRole,
    createdAt: user.createdAt,
  };
}

function toOrganization(organization: OrganizationRecord): OrganizationRecord {
  return organization;
}

export function createPrismaStore(prisma: PrismaClient): AuthStore {
  let dummyHash: Promise<string> | null = null;

  return {
    async ping() {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    async createUser(input) {
      try {
        const user = await prisma.user.create({
          data: {
            email: input.email.trim().toLowerCase(),
            name: input.name ?? null,
            passwordHash: await hashPassword(input.password),
            platformRole: input.platformRole ?? 'NONE',
          },
        });
        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            action: 'user.registered',
            entityType: 'User',
            entityId: user.id,
            metadata: {},
          },
        });
        return toPublicUser(user);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError(409, 'CONFLICT', 'An account with this email already exists');
        }
        throw error;
      }
    },
    async verifyLogin(email, password) {
      const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user?.passwordHash) {
        dummyHash ??= hashPassword('not-a-real-user-password');
        await verifyPassword(password, await dummyHash);
        return null;
      }
      const matches = await verifyPassword(password, user.passwordHash);
      if (!matches) return null;
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'user.logged_in',
          entityType: 'User',
          entityId: user.id,
          metadata: {},
        },
      });
      return toPublicUser(user);
    },
    async findUserById(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toPublicUser(user) : null;
    },
    async createOrganization(input) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const organization = await tx.organization.create({
            data: { name: input.name, slug: input.slug, kind: input.kind },
          });
          await tx.organizationMembership.create({
            data: { organizationId: organization.id, userId: input.ownerUserId, role: 'OWNER' },
          });
          await tx.clientWorkspace.create({
            data: {
              organizationId: organization.id,
              name: organization.name,
              slug: organization.slug,
            },
          });
          await tx.auditLog.create({
            data: {
              organizationId: organization.id,
              actorUserId: input.ownerUserId,
              action: 'organization.created',
              entityType: 'Organization',
              entityId: organization.id,
              metadata: { slug: organization.slug },
            },
          });
          return organization;
        });
        return { ...toOrganization(created), role: 'OWNER' as const };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError(409, 'CONFLICT', 'Organization slug is already in use');
        }
        throw error;
      }
    },
    async listMemberships(userId) {
      const rows = await prisma.organizationMembership.findMany({
        where: { userId },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(
        (row): MembershipSummary => ({
          organizationId: row.organizationId,
          organizationName: row.organization.name,
          organizationSlug: row.organization.slug,
          role: row.role,
        }),
      );
    },
    async getOrganizationForUser(userId, organizationId) {
      const membership = await prisma.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        include: { organization: true },
      });
      if (!membership) return null;
      return { ...toOrganization(membership.organization), role: membership.role };
    },
    async getOrganizationById(organizationId) {
      return prisma.organization.findUnique({ where: { id: organizationId } });
    },
    async listWorkspaces(organizationId) {
      return prisma.clientWorkspace.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      });
    },
    async listWorkspaceIdsForUser(userId, organizationId) {
      const rows = await prisma.workspaceMembership.findMany({
        where: { userId, organizationId },
        select: { workspaceId: true },
      });
      return rows.map((row) => row.workspaceId);
    },
    async assignWorkspace(input) {
      const workspace = await prisma.clientWorkspace.findFirst({
        where: { id: input.workspaceId, organizationId: input.organizationId },
      });
      if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');
      await prisma.workspaceMembership.upsert({
        where: { workspaceId_userId: { workspaceId: input.workspaceId, userId: input.userId } },
        create: input,
        update: {},
      });
    },
    async listAuditActionsForActor(actorUserId) {
      const rows = await prisma.auditLog.findMany({
        where: { actorUserId },
        select: { action: true },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((row) => row.action);
    },
  };
}
