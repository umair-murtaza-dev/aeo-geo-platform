import type { MembershipRole, PlatformRole } from '@aeo/shared';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  platformRole: PlatformRole;
  createdAt: Date;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  kind: 'AGENCY' | 'BUSINESS';
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipSummary {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MembershipRole;
}

export interface WorkspaceRecord {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEntry {
  organizationId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, string | number | boolean | null>;
}

export interface AuthStore {
  ping(): Promise<boolean>;
  createUser(input: {
    email: string;
    password: string;
    name?: string;
    platformRole?: PlatformRole;
  }): Promise<PublicUser>;
  verifyLogin(email: string, password: string): Promise<PublicUser | null>;
  findUserById(id: string): Promise<PublicUser | null>;
  createOrganization(input: {
    name: string;
    slug: string;
    kind: 'AGENCY' | 'BUSINESS';
    ownerUserId: string;
  }): Promise<OrganizationRecord & { role: MembershipRole }>;
  listMemberships(userId: string): Promise<MembershipSummary[]>;
  getOrganizationForUser(
    userId: string,
    organizationId: string,
  ): Promise<(OrganizationRecord & { role: MembershipRole }) | null>;
  getOrganizationById(organizationId: string): Promise<OrganizationRecord | null>;
  listWorkspaces(organizationId: string): Promise<WorkspaceRecord[]>;
  listWorkspaceIdsForUser(userId: string, organizationId: string): Promise<string[]>;
  assignWorkspace(input: { organizationId: string; workspaceId: string; userId: string }): Promise<void>;
  listAuditActionsForActor(actorUserId: string): Promise<string[]>;
}
