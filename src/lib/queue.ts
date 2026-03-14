import { Queue, Worker, type Processor } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const parsed = new URL(redisUrl);

const connectionOptions = {
  host: parsed.hostname,
  port: Number(parsed.port) || 6379,
  password: parsed.password || undefined,
  maxRetriesPerRequest: null as null,
};

export const scanQueue = new Queue('scans', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5 * 60 * 1000 }, // 5 min retry for OOM/crash
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
export const freeScanQueue = new Queue('free-scans', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export function createWorker<T>(
  queueName: string,
  processor: Processor<T>,
  concurrency: number = 4
) {
  return new Worker<T>(queueName, processor, {
    connection: connectionOptions,
    concurrency,
  });
}

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});
