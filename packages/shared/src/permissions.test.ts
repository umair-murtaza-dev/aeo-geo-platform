import { describe, expect, it } from 'vitest';
import {
  MEMBERSHIP_ROLES,
  PERMISSIONS,
  authorizeTenantAction,
  hasPermission,
  visibleWorkspaces,
} from './permissions';

const ORG_A = '11111111-1111-4111-8111-111111111111';
const ORG_B = '22222222-2222-4222-8222-222222222222';
const WORKSPACE_A = '33333333-3333-4333-8333-333333333333';
const WORKSPACE_B = '44444444-4444-4444-8444-444444444444';

describe('permission matrix', () => {
  it('does not grant platform administration to any membership role', () => {
    for (const role of MEMBERSHIP_ROLES) {
      expect(hasPermission(role, 'platform:admin')).toBe(false);
    }
  });

  it('keeps client viewers read-only on assigned resources', () => {
    expect(hasPermission('CLIENT_VIEWER', 'brand:read')).toBe(true);
    expect(hasPermission('CLIENT_VIEWER', 'brand:write')).toBe(false);
    expect(hasPermission('CLIENT_VIEWER', 'billing:read')).toBe(false);
    expect(hasPermission('CLIENT_VIEWER', 'experiment:read')).toBe(false);
  });

  it('gives owners billing management and withholds it from admins', () => {
    expect(hasPermission('OWNER', 'billing:manage')).toBe(true);
    expect(hasPermission('ADMIN', 'billing:manage')).toBe(false);
    expect(hasPermission('OWNER', 'org:delete')).toBe(true);
    expect(hasPermission('ADMIN', 'org:delete')).toBe(false);
  });

  it('covers every permission from at least the owner or platform set', () => {
    expect(PERMISSIONS.length).toBeGreaterThan(10);
  });
});

describe('authorizeTenantAction', () => {
  it('denies a member of another organization', () => {
    const decision = authorizeTenantAction({
      platformRole: 'NONE',
      membership: { role: 'OWNER', organizationId: ORG_A },
      requestedOrganizationId: ORG_B,
      permission: 'org:read',
    });
    expect(decision).toEqual({ ok: false, code: 'TENANT_FORBIDDEN' });
  });

  it('denies a missing membership', () => {
    const decision = authorizeTenantAction({
      platformRole: 'NONE',
      membership: null,
      requestedOrganizationId: ORG_A,
      permission: 'brand:read',
    });
    expect(decision.ok).toBe(false);
  });

  it('denies a client viewer who is not assigned to the workspace', () => {
    const decision = authorizeTenantAction({
      platformRole: 'NONE',
      membership: { role: 'CLIENT_VIEWER', organizationId: ORG_A },
      requestedOrganizationId: ORG_A,
      permission: 'brand:read',
      workspaceId: WORKSPACE_B,
      allowedWorkspaceIds: [WORKSPACE_A],
    });
    expect(decision).toEqual({ ok: false, code: 'WORKSPACE_FORBIDDEN' });
  });

  it('allows a client viewer to read an assigned workspace', () => {
    const decision = authorizeTenantAction({
      platformRole: 'NONE',
      membership: { role: 'CLIENT_VIEWER', organizationId: ORG_A },
      requestedOrganizationId: ORG_A,
      permission: 'brand:read',
      workspaceId: WORKSPACE_A,
      allowedWorkspaceIds: [WORKSPACE_A],
    });
    expect(decision.ok).toBe(true);
  });

  it('requires a workspace id for client viewer resource reads', () => {
    const decision = authorizeTenantAction({
      platformRole: 'NONE',
      membership: { role: 'CLIENT_VIEWER', organizationId: ORG_A },
      requestedOrganizationId: ORG_A,
      permission: 'observation:read',
    });
    expect(decision).toEqual({ ok: false, code: 'WORKSPACE_FORBIDDEN' });
  });

  it('allows agency members to read the organization without a workspace filter', () => {
    const decision = authorizeTenantAction({
      platformRole: 'NONE',
      membership: { role: 'MEMBER', organizationId: ORG_A },
      requestedOrganizationId: ORG_A,
      permission: 'observation:read',
    });
    expect(decision.ok).toBe(true);
  });

  it('allows a platform admin without pretending they are an organization member', () => {
    const decision = authorizeTenantAction({
      platformRole: 'PLATFORM_ADMIN',
      membership: null,
      requestedOrganizationId: ORG_B,
      permission: 'org:read',
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.role).toBe('PLATFORM_ADMIN');
      expect(decision.permissions).toContain('platform:admin');
    }
  });
});

describe('visibleWorkspaces', () => {
  const workspaces = [
    { id: WORKSPACE_A, organizationId: ORG_A, name: 'A' },
    { id: WORKSPACE_B, organizationId: ORG_A, name: 'B' },
  ];

  it('limits client viewers to assigned workspaces', () => {
    const visible = visibleWorkspaces({
      role: 'CLIENT_VIEWER',
      workspaces,
      membershipWorkspaceIds: [WORKSPACE_A],
    });
    expect(visible.map((workspace) => workspace.id)).toEqual([WORKSPACE_A]);
  });

  it('shows every workspace in the organization to agency members', () => {
    const visible = visibleWorkspaces({
      role: 'MEMBER',
      workspaces,
      membershipWorkspaceIds: [],
    });
    expect(visible).toHaveLength(2);
  });
});
