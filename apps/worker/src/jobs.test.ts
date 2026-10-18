import { UnrecoverableError } from 'bullmq';
import { describe, expect, it } from 'vitest';
import { RETRY_ATTEMPTS, WORKER_CONCURRENCY, jobOptions, processMonitoringJob, processPingJob } from './jobs';

describe('job contracts', () => {
  it('defines retry and concurrency defaults', () => {
    expect(RETRY_ATTEMPTS).toBe(3);
    expect(WORKER_CONCURRENCY.systemPing).toBe(5);
    expect(WORKER_CONCURRENCY.monitoringExecute).toBe(2);
    expect(jobOptions('run-12345678')).toMatchObject({
      jobId: 'run-12345678',
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  });

  it('processes a harmless ping and defers monitoring without calling a provider', () => {
    expect(processPingJob({ requestedAt: '2026-10-18T12:00:00.000Z' })).toEqual({
      pong: true,
      echoedAt: '2026-10-18T12:00:00.000Z',
    });
    expect(
      processMonitoringJob({
        organizationId: '11111111-1111-4111-8111-111111111111',
        runId: '33333333-3333-4333-8333-333333333333',
        idempotencyKey: 'run-key-12345678',
      }).status,
    ).toBe('deferred');
  });

  it('does not retry invalid payloads', () => {
    expect(() => processPingJob({ requestedAt: 'yesterday' })).toThrow(UnrecoverableError);
    expect(() => processMonitoringJob({})).toThrow(UnrecoverableError);
  });
});
