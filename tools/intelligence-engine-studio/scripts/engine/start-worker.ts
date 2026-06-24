/**
 * Distributed Worker Entrypoint
 * This script is intended to run as a continuous background process.
 * Can scale horizontally across multiple ECS/Cloud Run instances.
 */

import { WorkerNode } from '../../lib/intelligence-engine/worker-node';
import os from 'os';

async function bootstrap() {
  const containerId = process.env.HOSTNAME || os.hostname();
  const workerNode = new WorkerNode(`worker-${containerId}`);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Worker Daemon] Received ${signal}, draining in-flight batch before exit...`);
    await workerNode.stop();
    process.exit(0);
  };

  // stop() is now async (drains the in-flight batch, capped internally) --
  // previously this fired process.exit(0) immediately after a synchronous
  // stop(), which could hard-kill a fetch mid-flight on every signal.
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS) || 5000;
  const batchSize = Number(process.env.WORKER_BATCH_SIZE) || 10;

  console.log(`[Worker Daemon] Starting on host ${containerId} (pollIntervalMs=${pollIntervalMs}, batchSize=${batchSize})`);

  await workerNode.start(pollIntervalMs, batchSize);
}

bootstrap().catch((error) => {
  console.error('[Worker Daemon] Encountered fatal failure:', error);
  process.exit(1);
});
