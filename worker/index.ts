import { createWorker, scanQueue } from '../src/lib/queue';
import { processFullScan, type ScanJobData } from './jobs/full-scan';
import { processFreeScan, type FreeScanJobData } from './jobs/free-scan';
import { runScheduledScans, sendWeeklyDigests, cleanupFreescans } from './scheduler';
import { Queue } from 'bullmq';

// Use same connection options pattern as queue.ts
const parsed = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connectionOptions = {
  host: parsed.hostname,
  port: Number(parsed.port) || 6379,
  password: parsed.password || undefined,
  maxRetriesPerRequest: null as null,
};

// --- Workers ---
const scanWorker = createWorker<ScanJobData>('scans', async (job) => {
  await processFullScan(job.data);
}, 4);

const freeScanWorker = createWorker<FreeScanJobData>('free-scans', async (job) => {
  await processFreeScan(job.data);
}, 2);

// --- Cron jobs via BullMQ repeatable jobs ---
const cronQueue = new Queue('cron', { connection: connectionOptions });

async function setupCronJobs() {
  await cronQueue.add('scheduled-scans', {}, {
    repeat: { every: 60 * 60 * 1000 },
    jobId: 'scheduled-scans',
  });

  await cronQueue.add('weekly-digest', {}, {
    repeat: { pattern: '0 8 * * 1' },
    jobId: 'weekly-digest',
  });

  await cronQueue.add('cleanup-freescans', {}, {
    repeat: { pattern: '0 3 * * *' },
    jobId: 'cleanup-freescans',
  });
}

const cronWorker = createWorker('cron', async (job) => {
  switch (job.name) {
    case 'scheduled-scans': await runScheduledScans(); break;
    case 'weekly-digest': await sendWeeklyDigests(); break;
    case 'cleanup-freescans': await cleanupFreescans(); break;
  }
}, 1);

setupCronJobs().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await scanWorker.close();
  await freeScanWorker.close();
  await cronWorker.close();
  process.exit(0);
});

console.log('[worker] AccessEval scan worker started');
