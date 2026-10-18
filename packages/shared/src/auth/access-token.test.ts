import { describe, expect, it } from 'vitest';
import {
  issueAccessToken,
  unsafeDecodeAccessToken,
  verifyAccessToken,
} from './access-token';

const SECRET = 'test-secret-must-be-at-least-32-characters';
const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('access tokens', () => {
  it('round-trips a principal and omits tenant authority', async () => {
    const issued = await issueAccessToken(
      { userId: USER_ID, email: 'owner@example.com', name: 'Avery' },
      { secret: SECRET },
    );
    const principal = await verifyAccessToken(issued.token, { secret: SECRET });
    expect(principal.userId).toBe(USER_ID);
    expect(principal.email).toBe('owner@example.com');
    expect(issued.tokenType).toBe('Bearer');

    const payload = unsafeDecodeAccessToken(issued.token);
    expect(payload).not.toHaveProperty('organizationId');
    expect(payload).not.toHaveProperty('permissions');
    expect(payload).not.toHaveProperty('role');
    expect(payload.aud).toBe('aeo-api');
    expect(payload.iss).toBe('aeo-web');
  });

  it('rejects a token signed for a different audience', async () => {
    const issued = await issueAccessToken(
      { userId: USER_ID, email: 'owner@example.com' },
      { secret: SECRET },
    );
    const tampered = `${issued.token}x`;
    await expect(verifyAccessToken(tampered, { secret: SECRET })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects an expired token', async () => {
    const issued = await issueAccessToken(
      { userId: USER_ID, email: 'owner@example.com' },
      { secret: SECRET, now: new Date('2020-01-01T00:00:00.000Z'), expiresInSeconds: 60 },
    );
    await expect(verifyAccessToken(issued.token, { secret: SECRET })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a short secret', async () => {
    await expect(
      issueAccessToken({ userId: USER_ID, email: 'owner@example.com' }, { secret: 'short' }),
    ).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });
});
