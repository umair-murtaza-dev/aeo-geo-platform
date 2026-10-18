export const MEMBERSHIP_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'CLIENT_VIEWER'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const PLATFORM_ROLES = ['NONE', 'PLATFORM_ADMIN'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PERMISSIONS = [
  'org:read',
  'org:update',
  'org:delete',
  'membership:read',
  'membership:invite',
  'membership:update',
  'membership:remove',
  'workspace:read',
  'workspace:create',
  'workspace:update',
  'workspace:delete',
  'brand:read',
  'brand:write',
  'competitor:read',
  'competitor:write',
  'prompt:read',
  'prompt:write',
  'monitoring:read',
  'monitoring:run',
  'observation:read',
  'audit:read',
  'audit:run',
  'recommendation:read',
  'recommendation:write',
  'task:write',
  'experiment:read',
  'experiment:write',
  'report:read',
  'report:export',
  'billing:read',
  'billing:manage',
  'platform:admin',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const clientViewer: Permission[] = [
  'org:read',
  'workspace:read',
  'brand:read',
  'competitor:read',
  'prompt:read',
  'monitoring:read',
  'observation:read',
  'audit:read',
  'recommendation:read',
  'report:read',
];

const member: Permission[] = [
  ...clientViewer,
  'brand:write',
  'competitor:write',
  'prompt:write',
  'monitoring:run',
  'audit:run',
  'recommendation:write',
  'task:write',
  'report:export',
  'experiment:read',
];

const admin: Permission[] = [
  ...member,
  'org:update',
  'membership:read',
  'membership:invite',
  'membership:update',
  'membership:remove',
  'workspace:create',
  'workspace:update',
  'experiment:write',
  'billing:read',
];

const owner: Permission[] = [...admin, 'org:delete', 'workspace:delete', 'billing:manage'];

export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  OWNER: owner,
  ADMIN: admin,
  MEMBER: member,
  CLIENT_VIEWER: clientViewer,
};

export function permissionsForRole(role: MembershipRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: MembershipRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requiresWorkspaceScope(role: MembershipRole, permission: Permission): boolean {
  return role === 'CLIENT_VIEWER' && permission !== 'org:read';
}

export interface TenantAccessInput {
  platformRole: PlatformRole;
  membership: { role: MembershipRole; organizationId: string } | null;
  requestedOrganizationId: string;
  permission: Permission;
  workspaceId?: string | null;
  allowedWorkspaceIds?: readonly string[];
}

export type TenantAccessDecision =
  | { ok: true; role: MembershipRole | 'PLATFORM_ADMIN'; permissions: readonly Permission[] }
  | { ok: false; code: 'TENANT_FORBIDDEN' | 'WORKSPACE_FORBIDDEN' };

/**
 * Authorization does not trust an organization id supplied by the client.
 * The caller must load membership from the database and pass it here.
 * Platform admins still require the service to confirm the organization exists.
 */
export function authorizeTenantAction(input: TenantAccessInput): TenantAccessDecision {
  if (input.platformRole === 'PLATFORM_ADMIN') {
    return { ok: true, role: 'PLATFORM_ADMIN', permissions: PERMISSIONS };
  }

  if (!input.membership || input.membership.organizationId !== input.requestedOrganizationId) {
    return { ok: false, code: 'TENANT_FORBIDDEN' };
  }

  if (!hasPermission(input.membership.role, input.permission)) {
    return { ok: false, code: 'TENANT_FORBIDDEN' };
  }

  if (requiresWorkspaceScope(input.membership.role, input.permission)) {
    if (!input.workspaceId) {
      return { ok: false, code: 'WORKSPACE_FORBIDDEN' };
    }
    const allowed = input.allowedWorkspaceIds ?? [];
    if (!allowed.includes(input.workspaceId)) {
      return { ok: false, code: 'WORKSPACE_FORBIDDEN' };
    }
  }

  return {
    ok: true,
    role: input.membership.role,
    permissions: permissionsForRole(input.membership.role),
  };
}

export interface WorkspaceRecord {
  id: string;
  organizationId: string;
}

/**
 * Agency roles see every workspace in the organization.
 * Client viewers see only workspaces they are explicitly assigned to.
 */
export function visibleWorkspaces<T extends WorkspaceRecord>(input: {
  role: MembershipRole;
  workspaces: readonly T[];
  membershipWorkspaceIds: readonly string[];
}): T[] {
  if (input.role !== 'CLIENT_VIEWER') {
    return [...input.workspaces];
  }
  const allowed = new Set(input.membershipWorkspaceIds);
  return input.workspaces.filter((workspace) => allowed.has(workspace.id));
}
