import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  params: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, params, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export interface ScryptParams {
  N: number;
  r: 8;
  p: 1;
}

const PRODUCTION_PARAMS: ScryptParams = { N: 16384, r: 8, p: 1 };

/** Production always uses the production cost. A lower cost is honored only when NODE_ENV is test. */
export function resolveScryptParams(env: NodeJS.ProcessEnv = process.env): ScryptParams {
  if (env.NODE_ENV !== 'test') return PRODUCTION_PARAMS;
  const requested = Number(env.PASSWORD_SCRYPT_N);
  if (!Number.isInteger(requested) || requested < 1024 || requested > 16384) {
    return PRODUCTION_PARAMS;
  }
  return { N: requested, r: 8, p: 1 };
}

export async function hashPassword(password: string, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const params = resolveScryptParams(env);
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 32, params)) as Buffer;
  return [
    'scrypt',
    String(params.N),
    String(params.r),
    String(params.p),
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || n < 1024 || n > 262144 || r !== 8 || p !== 1) return false;
  const salt = Buffer.from(parts[4] ?? '', 'base64url');
  const expected = Buffer.from(parts[5] ?? '', 'base64url');
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = (await scryptAsync(password, salt, expected.length, { N: n, r, p })) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
