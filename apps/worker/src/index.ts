import { config } from 'dotenv';
import { Redis } from 'ioredis';
import pino from 'pino';
import { resolve } from 'node:path';
import { createWorkers } from './runtime';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL is not set. Worker did not start.');
  process.exit(1);
}

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const runtime = createWorkers(connection);
logger.info({ concurrency: { systemPing: 5, monitoringExecute: 2 } }, 'worker started');

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'worker shutting down');
  await runtime.shutdown();
  await connection.quit();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
