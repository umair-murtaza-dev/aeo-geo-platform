import { createPrismaStore, getPrisma } from '@aeo/db';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createApp } from './app';
import { createLogger, safeLogMessage } from './logger';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const logger = createLogger(process.env.LOG_LEVEL ?? 'info');
const prisma = getPrisma();
const store = prisma ? createPrismaStore(prisma) : null;
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = createApp({
  store,
  authSecret: process.env.AUTH_SECRET,
  corsOrigins,
  logLevel: process.env.LOG_LEVEL ?? 'info',
  checkDatabase: async () => {
    if (!prisma) return 'not_configured';
    try {
      await prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch (error) {
      logger.error({ err: safeLogMessage(error) }, 'database readiness check failed');
      return 'down';
    }
  },
});

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => {
  logger.info({ port }, 'api listening');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'api shutting down');
  server.close(() => {
    void prisma?.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
