import { createWorker } from '../src/lib/queue';
import { processFullScan, type ScanJobData } from './jobs/full-scan';
import { processFreeScan, type FreeScanJobData } from './jobs/free-scan';

const scanWorker = createWorker<ScanJobData>('scans', async (job) => {
  await processFullScan(job.data);
}, 4);

const freeScanWorker = createWorker<FreeScanJobData>('free-scans', async (job) => {
  await processFreeScan(job.data);
}, 2);

process.on('SIGTERM', async () => {
  await scanWorker.close();
  await freeScanWorker.close();
  process.exit(0);
});

console.log('[worker] AccessEval scan worker started');
