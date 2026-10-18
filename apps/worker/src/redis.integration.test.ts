import { QUEUE_NAMES } from '@aeo/shared';
import { Queue, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { afterAll, describe, expect, it } from 'vitest';
import { enqueueWithIdempotency, processPingJob } from './jobs';

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

async function redisReachable(url: string): Promise<boolean> {
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  try {
    await redis.connect();
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  } finally {
    redis.disconnect();
  }
}

const redisUp = await redisReachable(redisUrl);

describe('bullmq ping job', () => {
  const prefix = `aeo-m01-test-${process.pid}-${Date.now()}`;
  const connection = redisUp ? new Redis(redisUrl, { maxRetriesPerRequest: null }) : null;

  afterAll(async () => {
    await connection?.quit();
  });

  it.skipIf(!redisUp)('processes one harmless job and treats a repeated idempotency key as a duplicate', async () => {
    if (!connection) return;
    const queue = new Queue(QUEUE_NAMES.systemPing, { connection, prefix });
    const events = new QueueEvents(QUEUE_NAMES.systemPing, { connection, prefix });
    const { Worker } = await import('bullmq');

    const payload = { requestedAt: '2026-10-18T12:00:00.000Z' };
    const key = `ping-${prefix}`;
    const first = await enqueueWithIdempotency(queue, 'ping', payload, key);
    expect(first.status).toBe('enqueued');
    const second = await enqueueWithIdempotency(queue, 'ping', payload, key);
    expect(second.status).toBe('duplicate');

    const worker = new Worker(QUEUE_NAMES.systemPing, async (job) => processPingJob(job.data), {
      connection,
      prefix,
      concurrency: 1,
    });
    const job = await queue.getJob(key);
    expect(job).toBeTruthy();
    const result = await job?.waitUntilFinished(events, 10_000);
    expect(result).toEqual({ pong: true, echoedAt: payload.requestedAt });

    await worker.close();
    await events.close();
    await queue.obliterate({ force: true });
    await queue.close();
  });
});
