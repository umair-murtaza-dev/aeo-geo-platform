import { describe, expect, it } from 'vitest';
import { hashPassword, resolveScryptParams, verifyPassword } from './password';

describe('password hashing', () => {
  it('uses the production cost outside tests', () => {
    expect(resolveScryptParams({ NODE_ENV: 'production', PASSWORD_SCRYPT_N: '1024' }).N).toBe(16384);
  });

  it('honors a bounded test cost', () => {
    expect(resolveScryptParams({ NODE_ENV: 'test', PASSWORD_SCRYPT_N: '1024' }).N).toBe(1024);
  });

  it('verifies a matching password and rejects a different one', async () => {
    const hash = await hashPassword('correct-horse-battery');
    expect(await verifyPassword('correct-horse-battery', hash)).toBe(true);
    expect(await verifyPassword('wrong-horse-battery', hash)).toBe(false);
    expect(hash.startsWith('scrypt$')).toBe(true);
  });
});
