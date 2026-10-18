import type { AuthStore } from '@aeo/db';
import {
  AppError,
  PERMISSIONS,
  authorizeTenantAction,
  createOrganizationRequestSchema,
  formatUtc,
  issueAccessToken,
  loginRequestSchema,
  organizationSchema,
  paginationQuerySchema,
  permissionsForRole,
  publicUserSchema,
  registerRequestSchema,
  sessionResponseSchema,
  visibleWorkspaces,
  workspaceSchema,
  type Permission,
} from '@aeo/shared';
import cors from 'cors';
import express, { type Express, type Request } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { asyncHandler, sendData, sendError } from './http';
import { createLogger, safeLogMessage } from './logger';
import { requirePrincipal } from './middleware/auth';
import { errorHandler } from './middleware/error';

export interface AppDependencies {
  store: AuthStore | null;
  authSecret?: string;
  corsOrigins: string[];
  checkDatabase: () => Promise<'up' | 'down' | 'not_configured'>;
  logLevel?: string;
}

export const IMPLEMENTED_ROUTES = [
  'GET /api/v1/health',
  'GET /api/v1/ready',
  'GET /api/v1',
  'POST /api/v1/auth/register',
  'POST /api/v1/auth/login',
  'GET /api/v1/me',
  'GET /api/v1/organizations',
  'POST /api/v1/organizations',
  'GET /api/v1/organizations/:organizationId',
  'GET /api/v1/organizations/:organizationId/workspaces',
] as const;

function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function requireStore(store: AuthStore | null): AuthStore {
  if (!store) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Database is not configured');
  return store;
}

function requiredPrincipal(req: Request) {
  if (!req.principal) throw new AppError(401, 'UNAUTHENTICATED', 'Bearer token required');
  return req.principal;
}

function parseOrganizationId(value: string): string {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
  return parsed.data;
}

function serializeOrganization(organization: {
  id: string;
  name: string;
  slug: string;
  kind: 'AGENCY' | 'BUSINESS';
  createdAt: Date;
  updatedAt: Date;
}) {
  return organizationSchema.parse({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    kind: organization.kind,
    createdAt: formatUtc(organization.createdAt),
    updatedAt: formatUtc(organization.updatedAt),
  });
}

function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  platformRole: 'NONE' | 'PLATFORM_ADMIN';
  createdAt: Date;
}) {
  return publicUserSchema.parse({
    ...user,
    createdAt: formatUtc(user.createdAt),
  });
}

async function loadAuthorizedOrganization(
  store: AuthStore,
  userId: string,
  organizationId: string,
  permission: Extract<Permission, 'org:read' | 'workspace:read'>,
) {
  const user = await store.findUserById(userId);
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'User no longer exists');
  const membership = await store.getOrganizationForUser(userId, organizationId);
  const organization =
    membership ??
    (user.platformRole === 'PLATFORM_ADMIN' ? await store.getOrganizationById(organizationId) : null);
  if (!organization) throw new AppError(404, 'NOT_FOUND', 'Organization not found');

  const decision = authorizeTenantAction({
    platformRole: user.platformRole,
    membership: membership ? { role: membership.role, organizationId } : null,
    requestedOrganizationId: organizationId,
    permission,
  });
  if (!decision.ok) {
    if (!membership) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
    throw new AppError(403, decision.code, 'You do not have permission for this organization');
  }
  return { organization, decision };
}

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const logger = createLogger(deps.logLevel ?? 'silent');
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const incoming = req.header('x-request-id');
    const requestId =
      incoming && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || deps.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new AppError(403, 'FORBIDDEN', 'Origin is not allowed'));
      },
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get(['/health', '/api/v1/health'], (req, res) => {
    sendData(res, req.requestId, { service: 'api', status: 'live' });
  });

  app.get(
    ['/ready', '/api/v1/ready'],
    asyncHandler(async (req, res) => {
      let database: 'up' | 'down' | 'not_configured' = 'down';
      try {
        database = await deps.checkDatabase();
      } catch (error) {
        logger.error({ requestId: req.requestId, err: safeLogMessage(error) }, 'readiness failed');
        database = 'down';
      }
      const ready = database === 'up';
      res.status(ready ? 200 : 503).json({
        ok: ready,
        data: { service: 'api', status: ready ? 'ready' : 'not_ready', checks: { database } },
        requestId: req.requestId,
      });
    }),
  );

  app.get('/api/v1', (req, res) => {
    sendData(res, req.requestId, {
      service: 'aeo-api',
      version: 'v1',
      implemented: IMPLEMENTED_ROUTES,
    });
  });

  app.post(
    '/api/v1/auth/register',
    asyncHandler(async (req, res) => {
      const body = registerRequestSchema.parse(req.body);
      const user = await requireStore(deps.store).createUser({
        email: body.email,
        password: body.password,
        name: body.name,
      });
      sendData(res, req.requestId, { user: serializeUser(user) }, 201);
    }),
  );

  app.post(
    '/api/v1/auth/login',
    asyncHandler(async (req, res) => {
      const body = loginRequestSchema.parse(req.body);
      if (!deps.authSecret) {
        throw new AppError(503, 'SERVICE_UNAVAILABLE', 'AUTH_SECRET is not configured');
      }
      const user = await requireStore(deps.store).verifyLogin(body.email, body.password);
      if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid email or password');
      const issued = await issueAccessToken(
        { userId: user.id, email: user.email, name: user.name },
        { secret: deps.authSecret },
      );
      sendData(res, req.requestId, {
        tokenType: issued.tokenType,
        accessToken: issued.token,
        expiresAt: issued.expiresAt,
        user: serializeUser(user),
      });
    }),
  );

  app.get(
    '/api/v1/me',
    requirePrincipal(deps.authSecret),
    asyncHandler(async (req, res) => {
      const store = requireStore(deps.store);
      const principal = requiredPrincipal(req);
      const user = await store.findUserById(principal.userId);
      if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'User no longer exists');
      const memberships = await store.listMemberships(user.id);
      sendData(
        res,
        req.requestId,
        sessionResponseSchema.parse({
          user: serializeUser(user),
          memberships: memberships.map((membership) => ({
            ...membership,
            permissions: permissionsForRole(membership.role),
          })),
          platformPermissions: user.platformRole === 'PLATFORM_ADMIN' ? [...PERMISSIONS] : [],
        }),
      );
    }),
  );

  app.get(
    '/api/v1/organizations',
    requirePrincipal(deps.authSecret),
    asyncHandler(async (req, res) => {
      paginationQuerySchema.parse(req.query);
      const store = requireStore(deps.store);
      const memberships = await store.listMemberships(requiredPrincipal(req).userId);
      const items = [];
      for (const membership of memberships) {
        const organization = await store.getOrganizationById(membership.organizationId);
        if (organization) items.push(serializeOrganization(organization));
      }
      sendData(res, req.requestId, { items, nextCursor: null });
    }),
  );

  app.post(
    '/api/v1/organizations',
    requirePrincipal(deps.authSecret),
    asyncHandler(async (req, res) => {
      const body = createOrganizationRequestSchema.parse(req.body);
      const organization = await requireStore(deps.store).createOrganization({
        ...body,
        ownerUserId: requiredPrincipal(req).userId,
      });
      sendData(res, req.requestId, serializeOrganization(organization), 201);
    }),
  );

  app.get(
    '/api/v1/organizations/:organizationId',
    requirePrincipal(deps.authSecret),
    asyncHandler(async (req, res) => {
      const store = requireStore(deps.store);
      const organizationId = parseOrganizationId(routeParam(req.params.organizationId));
      const { organization } = await loadAuthorizedOrganization(
        store,
        requiredPrincipal(req).userId,
        organizationId,
        'org:read',
      );
      sendData(res, req.requestId, serializeOrganization(organization));
    }),
  );

  app.get(
    '/api/v1/organizations/:organizationId/workspaces',
    requirePrincipal(deps.authSecret),
    asyncHandler(async (req, res) => {
      paginationQuerySchema.parse(req.query);
      const store = requireStore(deps.store);
      const principal = requiredPrincipal(req);
      const organizationId = parseOrganizationId(routeParam(req.params.organizationId));
      const { decision } = await loadAuthorizedOrganization(
        store,
        principal.userId,
        organizationId,
        'workspace:read',
      );
      const workspaces = await store.listWorkspaces(organizationId);
      const allowed = await store.listWorkspaceIdsForUser(principal.userId, organizationId);
      const visible =
        decision.role === 'CLIENT_VIEWER'
          ? visibleWorkspaces({
              role: 'CLIENT_VIEWER',
              workspaces,
              membershipWorkspaceIds: allowed,
            })
          : [...workspaces];
      sendData(res, req.requestId, {
        items: visible.map((workspace) =>
          workspaceSchema.parse({
            ...workspace,
            createdAt: formatUtc(workspace.createdAt),
            updatedAt: formatUtc(workspace.updatedAt),
          }),
        ),
        nextCursor: null,
      });
    }),
  );

  app.use((req, res) => {
    sendError(res, 404, 'NOT_FOUND', 'Route not found', req.requestId);
  });
  app.use(errorHandler(logger));
  return app;
}
