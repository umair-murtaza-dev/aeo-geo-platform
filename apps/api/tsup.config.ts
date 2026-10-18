import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outExtension: () => ({ js: '.cjs' }),
  target: 'node22',
  platform: 'node',
  sourcemap: true,
  clean: true,
  noExternal: [/^@aeo\//],
});
