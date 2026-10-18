import { QUEUE_NAMES, monitoringExecuteJobSchema, pingJobSchema } from '@aeo/shared';
import { UnrecoverableError, type JobsOptions, type Queue } from 'bullmq';

export { QUEUE_NAMES };

export const WORKER_CONCURRENCY = {
  systemPing: 5,
  monitoringExecute: 2,
} as const;

export const RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 2_000;

export function jobOptions(idempotencyKey: string): JobsOptions {
  return {
    jobId: idempotencyKey,
    attempts: RETRY_ATTEMPTS,
    backoff: { type: 'exponential', delay: RETRY_BACKOFF_MS },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  };
}

export function processPingJob(data: unknown): { pong: true; echoedAt: string } {
  const parsed = pingJobSchema.safeParse(data);
  if (!parsed.success) {
    throw new UnrecoverableError('Ping payload failed validation');
  }
  return { pong: true, echoedAt: parsed.data.requestedAt };
}

/**
 * Accepts a monitoring job and records that execution is deferred.
 * This processor does not call an AI provider.
 */
export function processMonitoringJob(data: unknown): {
  status: 'deferred';
  reason: string;
  runId: string;
} {
  const parsed = monitoringExecuteJobSchema.safeParse(data);
  if (!parsed.success) {
    throw new UnrecoverableError('Monitoring payload failed validation');
  }
  return {
    status: 'deferred',
    reason: 'AI provider execution is not part of M01. No external request was made.',
    runId: parsed.data.runId,
  };
}

export async function enqueueWithIdempotency(
  queue: Queue,
  name: string,
  data: unknown,
  idempotencyKey: string,
): Promise<{ status: 'enqueued' | 'duplicate'; id: string }> {
  const existing = await queue.getJob(idempotencyKey);
  if (existing) return { status: 'duplicate', id: existing.id ?? idempotencyKey };
  try {
    const job = await queue.add(name, data, jobOptions(idempotencyKey));
    return { status: 'enqueued', id: job.id ?? idempotencyKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/already exists|JobId|job id/i.test(message)) {
      return { status: 'duplicate', id: idempotencyKey };
    }
    throw error;
  }
}
