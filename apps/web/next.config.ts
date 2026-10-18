import { config as loadEnv } from 'dotenv';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
loadEnv({ path: resolve(here, '../../.env') });

const nextConfig: NextConfig = {
  transpilePackages: ['@aeo/shared', '@aeo/ui', '@aeo/db'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
