import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      PASSWORD_SCRYPT_N: '1024',
    },
    testTimeout: 20000,
  },
});
