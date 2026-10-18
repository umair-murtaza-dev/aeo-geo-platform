import { createMemoryStore } from '@aeo/db';
import { unsafeDecodeAccessToken } from '@aeo/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

const SECRET = 'test-secret-must-be-at-least-32-characters';

function testApp(store = createMemoryStore()) {
  return {
    store,
    app: createApp({
      store,
      authSecret: SECRET,
      corsOrigins: ['http://localhost:3000'],
      checkDatabase: async () => 'up',
      logLevel: 'silent',
    }),
  };
}

describe('api foundation', () => {
  it('reports liveness without checking the database', async () => {
    const { app } = testApp();
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('live');
    expect(response.headers['x-request-id']).toBeTruthy();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('reports readiness without leaking connection details', async () => {
    const down = createApp({
      store: null,
      authSecret: SECRET,
      corsOrigins: ['http://localhost:3000'],
      checkDatabase: async () => {
        throw new Error('connect ECONNREFUSED postgres://user:supersecret@db.example/aeo');
      },
    });
    const response = await request(down).get('/api/v1/ready');
    expect(response.status).toBe(503);
    expect(response.body.data.checks.database).toBe('down');
    expect(JSON.stringify(response.body)).not.toContain('supersecret');
    expect(JSON.stringify(response.body)).not.toContain('postgres://');

    const unconfigured = createApp({
      store: null,
      corsOrigins: ['http://localhost:3000'],
      checkDatabase: async () => 'not_configured',
    });
    const ready = await request(unconfigured).get('/ready');
    expect(ready.status).toBe(503);
    expect(ready.body.data.checks.database).toBe('not_configured');
  });

  it('rejects an unknown register field and an oversized body', async () => {
    const { app } = testApp();
    const rejected = await request(app).post('/api/v1/auth/register').send({
      email: 'owner@example.com',
      password: 'correct-horse-battery',
      platformRole: 'PLATFORM_ADMIN',
    });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error.code).toBe('VALIDATION_ERROR');

    const oversized = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'a@example.com', password: 'x'.repeat(120_000) });
    expect(oversized.status).toBe(413);
  });

  it('registers, logs in, and denies cross-tenant reads', async () => {
    const { app, store } = testApp();
    const registered = await request(app).post('/api/v1/auth/register').send({
      email: 'Owner@Example.com',
      password: 'correct-horse-battery',
      name: 'Avery',
    });
    expect(registered.status).toBe(201);
    expect(registered.body.data.user.email).toBe('owner@example.com');
    expect(registered.body.data.user.platformRole).toBe('NONE');
    expect(JSON.stringify(registered.body)).not.toContain('passwordHash');

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'owner@example.com',
      password: 'correct-horse-battery',
    });
    expect(login.status).toBe(200);
    const token = login.body.data.accessToken as string;
    const payload = unsafeDecodeAccessToken(token);
    expect(payload).not.toHaveProperty('organizationId');

    const created = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Northwind', slug: 'northwind', kind: 'AGENCY' });
    expect(created.status).toBe(201);
    const organizationId = created.body.data.id as string;
    expect(created.body.data.name).toBe('Northwind');

    const outsider = await request(app).post('/api/v1/auth/register').send({
      email: 'outsider@example.com',
      password: 'correct-horse-battery',
    });
    expect(outsider.status).toBe(201);
    const outsiderLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'outsider@example.com',
      password: 'correct-horse-battery',
    });
    const outsiderToken = outsiderLogin.body.data.accessToken as string;
    const denied = await request(app)
      .get(`/api/v1/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(denied.status).toBe(404);
    expect(JSON.stringify(denied.body)).not.toContain('Northwind');

    const workspaces = await request(app)
      .get(`/api/v1/organizations/${organizationId}/workspaces`)
      .set('Authorization', `Bearer ${token}`);
    expect(workspaces.status).toBe(200);
    expect(workspaces.body.data.items).toHaveLength(1);

    const me = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.memberships[0].role).toBe('OWNER');
    expect(me.body.data.memberships[0].permissions).toContain('billing:manage');
    expect(me.body.data.memberships[0].permissions).not.toContain('platform:admin');

    const viewer = await store.createUser({
      email: 'viewer@example.com',
      password: 'correct-horse-battery',
      name: 'Viewer',
    });
    await store.createOrganization({
      name: 'Ignored',
      slug: 'ignored-viewer-org',
      kind: 'BUSINESS',
      ownerUserId: viewer.id,
    });
    const ownerOrg = await store.getOrganizationForUser(
      (await store.verifyLogin('owner@example.com', 'correct-horse-battery'))!.id,
      organizationId,
    );
    expect(ownerOrg?.role).toBe('OWNER');
  });

  it('rejects a disallowed browser origin', async () => {
    const { app } = testApp();
    const response = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns not found for an undocumented route', async () => {
    const { app } = testApp();
    const response = await request(app).get('/api/v1/visibility');
    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
  });
});
