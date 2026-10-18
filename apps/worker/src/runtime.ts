import { QUEUE_NAMES } from '@aeo/shared';
import { Worker, type ConnectionOptions } from 'bullmq';
import { WORKER_CONCURRENCY, processMonitoringJob, processPingJob } from './jobs';

export function createWorkers(connection: ConnectionOptions) {
  const ping = new Worker(QUEUE_NAMES.systemPing, async (job) => processPingJob(job.data), {
    connection,
    concurrency: WORKER_CONCURRENCY.systemPing,
  });
  const monitoring = new Worker(
    QUEUE_NAMES.monitoringExecute,
    async (job) => processMonitoringJob(job.data),
    { connection, concurrency: WORKER_CONCURRENCY.monitoringExecute },
  );

  return {
    workers: [ping, monitoring],
    async shutdown(): Promise<void> {
      await Promise.all([ping.close(), monitoring.close()]);
    },
  };
}
