import { SignJWT, decodeJwt, jwtVerify } from 'jose';
import { z } from 'zod';
import { AppError } from '../errors';

export const ACCESS_TOKEN_ISSUER = 'aeo-web';
export const ACCESS_TOKEN_AUDIENCE = 'aeo-api';
export const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;

export const accessTokenClaimsSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  name: z.string().nullable().optional(),
  jti: z.string().min(1),
  iss: z.literal(ACCESS_TOKEN_ISSUER),
  aud: z.literal(ACCESS_TOKEN_AUDIENCE),
  iat: z.number().int(),
  exp: z.number().int(),
});

export interface AccessTokenPrincipal {
  userId: string;
  email: string;
  name: string | null;
  jti: string;
  expiresAt: string;
}

function secretKey(secret: string): Uint8Array {
  if (secret.length < 32) {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'AUTH_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function issueAccessToken(
  input: { userId: string; email: string; name?: string | null },
  options: { secret: string; now?: Date; expiresInSeconds?: number },
): Promise<{ token: string; expiresAt: string; tokenType: 'Bearer' }> {
  const now = options.now ?? new Date();
  const ttl = options.expiresInSeconds ?? ACCESS_TOKEN_TTL_SECONDS;
  const expiresAt = new Date(now.getTime() + ttl * 1000);
  const token = await new SignJWT({
    email: input.email,
    name: input.name ?? null,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.userId)
    .setIssuer(ACCESS_TOKEN_ISSUER)
    .setAudience(ACCESS_TOKEN_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .setJti(crypto.randomUUID())
    .sign(secretKey(options.secret));

  return { token, expiresAt: expiresAt.toISOString(), tokenType: 'Bearer' };
}

export async function verifyAccessToken(
  token: string,
  options: { secret: string },
): Promise<AccessTokenPrincipal> {
  try {
    const { payload } = await jwtVerify(token, secretKey(options.secret), {
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
      algorithms: ['HS256'],
    });
    const parsed = accessTokenClaimsSchema.parse(payload);
    return {
      userId: parsed.sub,
      email: parsed.email,
      name: parsed.name ?? null,
      jti: parsed.jti,
      expiresAt: new Date(parsed.exp * 1000).toISOString(),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired access token');
  }
}

/** Test helper. Returns the unverified payload so tests can assert claims that must never appear. */
export function unsafeDecodeAccessToken(token: string): Record<string, unknown> {
  return decodeJwt(token) as Record<string, unknown>;
}
