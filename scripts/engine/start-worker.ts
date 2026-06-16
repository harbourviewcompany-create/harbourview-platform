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

  // Handle graceful shutdown signals for k8s/docker orchestration
  process.on('SIGTERM', () => {
    workerNode.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    workerNode.stop();
    process.exit(0);
  });

  const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS) || 5000;
  
  console.log(`[Worker Daemon] Starting on host ${containerId} with poll interval ${pollIntervalMs}ms`);
  
  // Start continuous polling and execution loop
  await workerNode.start(pollIntervalMs);
}

bootstrap().catch(error => {
  console.error('[Worker Daemon] Encoutered fatal failure:', error);
  process.exit(1);
});
