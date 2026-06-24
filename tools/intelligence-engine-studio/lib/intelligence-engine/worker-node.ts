import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DistributedTaskQueue } from './queue/task-queue';
import { CircuitBreaker } from './queue/circuit-breaker';
import { HTMLDataAdapter } from './adapters/html-fetcher';
import { RSSDataAdapter } from './adapters/rss-fetcher';
import { APIDataAdapter } from './adapters/api-fetcher';
import { PlaywrightDataAdapter } from './adapters/playwright-fetcher';
import { IDataAdapter, ScrapeTarget, ScraperResult } from './types';
import crypto from 'crypto';
import http from 'http';

const RETRYABLE_STATUS_PATTERN = /\b(429|500|502|503|504|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN)\b/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WorkerNode {
  private supabase: SupabaseClient;
  private queue: DistributedTaskQueue;
  private circuitBreaker: CircuitBreaker;

  private htmlAdapter: HTMLDataAdapter;
  private rssAdapter: RSSDataAdapter;
  private apiAdapter: APIDataAdapter;
  private playwrightAdapter: PlaywrightDataAdapter;

  private workerId: string;
  private isRunning = false;
  private inFlightBatch: Promise<void> | null = null;
  private targetsProcessedTotal = 0;
  private healthServer: http.Server | null = null;

  constructor(workerId?: string) {
    this.workerId = workerId || `worker-${crypto.randomUUID().slice(0, 8)}`;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    this.supabase = createClient(url, key, { auth: { persistSession: false } });
    this.queue = new DistributedTaskQueue(this.supabase);
    this.circuitBreaker = new CircuitBreaker(this.supabase);

    this.htmlAdapter = new HTMLDataAdapter();
    this.rssAdapter = new RSSDataAdapter();
    this.apiAdapter = new APIDataAdapter();
    this.playwrightAdapter = new PlaywrightDataAdapter();
  }

  /**
   * Main execution loop for the long-running worker daemon.
   * batchSize/pollIntervalMs can be overridden by the caller (see
   * scripts/engine/start-worker.ts, which reads them from env vars), so
   * tuning doesn't require a code change.
   */
  async start(pollIntervalMs: number = 10000, batchSize: number = 10) {
    this.isRunning = true;
    await this.writeHeartbeat('running');
    this.startHealthServer();
    console.log(`[WorkerNode:${this.workerId}] Booting intelligence extraction node (batchSize=${batchSize}, pollIntervalMs=${pollIntervalMs})...`);

    while (this.isRunning) {
      try {
        this.inFlightBatch = this.processBatch(batchSize);
        await this.inFlightBatch;
        this.inFlightBatch = null;
        await this.writeHeartbeat('running');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[WorkerNode:${this.workerId}] Batch loop error:`, message);
        await this.writeHeartbeat('running', message);
      }

      // Wait before polling again to prevent DB hammering.
      await sleep(pollIntervalMs);
    }
  }

  /**
   * Signal the loop to stop after the current batch finishes, and wait for
   * that in-flight batch (up to maxWaitMs) so a container orchestrator's
   * SIGTERM doesn't hard-kill mid-fetch, leaving rows leased until their
   * lease TTL expires. Returns once it's safe to exit.
   */
  async stop(maxWaitMs: number = 20000): Promise<void> {
    console.log(`[WorkerNode:${this.workerId}] Initiating graceful shutdown...`);
    this.isRunning = false;
    await this.writeHeartbeat('stopping');

    if (this.inFlightBatch) {
      await Promise.race([this.inFlightBatch, sleep(maxWaitMs)]);
    }

    this.stopHealthServer();
    await this.writeHeartbeat('stopped');
  }

  private async processBatch(batchSize: number) {
    // Refresh the shared circuit-breaker snapshot once per cycle rather
    // than once per target — see queue/circuit-breaker.ts.
    await this.circuitBreaker.refresh();

    const targets = await this.queue.acquireTargets(batchSize, this.workerId);

    if (targets.length === 0) {
      return;
    }

    console.log(`[WorkerNode:${this.workerId}] Acquired ${targets.length} targets. Engaging network layer...`);

    const results = await Promise.allSettled(targets.map((target) => this.processTarget(target)));
    this.targetsProcessedTotal += results.length;
  }

  private selectAdapter(target: ScrapeTarget): IDataAdapter | null {
    switch (target.adapter_type) {
      case 'rss':
        return this.rssAdapter;
      case 'api':
      case 'json_api':
        return this.apiAdapter;
      case 'playwright_full':
        return this.playwrightAdapter;
      case 'html_snapshot':
      case 'html_diff':
      default:
        return this.htmlAdapter;
    }
  }

  /** A few quick retries with jitter for transient errors only (timeouts, 429/5xx). Permanent errors (4xx other than 429, parse failures) are not retried here — they fall through to the circuit breaker / backoff schedule immediately. Honors Retry-After when the adapter surfaced one (capped at 30s — anything longer isn't worth blocking this batch for; the source's own exponential backoff schedule takes over instead). */
  private async fetchWithRetry(adapter: IDataAdapter, target: ScrapeTarget, maxAttempts = 3): Promise<ScraperResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await adapter.fetch(target);
        if (result.status === 'success' || result.status === 'unchanged') return result;
        if (attempt < maxAttempts && RETRYABLE_STATUS_PATTERN.test(result.error_message ?? '')) {
          const waitMs = result.retry_after_seconds !== undefined
            ? Math.min(result.retry_after_seconds, 30) * 1000
            : 300 * attempt + Math.random() * 200;
          await sleep(waitMs);
          continue;
        }
        return result;
      } catch (err: unknown) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts && RETRYABLE_STATUS_PATTERN.test(message)) {
          await sleep(300 * attempt + Math.random() * 200);
          continue;
        }
        throw err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async processTarget(target: ScrapeTarget) {
    let domain: string;
    try {
      domain = new URL(target.base_url).hostname;
    } catch {
      // Malformed URL is the source's own problem, not its domain
      // neighbors' — penalize normally.
      await this.queue.markFailure(target.id, 'Invalid URL format', target.consecutive_failures);
      return;
    }

    if (this.circuitBreaker.isLocked(domain)) {
      console.log(`[WorkerNode:${this.workerId}] Skipping ${target.base_url} (domain circuit open) — releasing lease without penalty.`);
      await this.queue.releaseLock(target.id);
      return;
    }

    try {
      const adapter = this.selectAdapter(target);

      if (!adapter) {
        // No adapter exists for this type (mirrors orchestrator.ts's
        // honest-blocked behavior — never silently fall back to a fetch
        // method that can't handle this adapter_type).
        await this.saveSnapshot(
          {
            target_id: target.id,
            timestamp: new Date().toISOString(),
            raw_content: '',
            content_hash: '',
            status: 'blocked',
            error_message: `No adapter implemented for adapter_type "${target.adapter_type}".`,
          },
          target,
        );
        await this.queue.markFailure(target.id, `No adapter for ${target.adapter_type}`, target.consecutive_failures);
        return;
      }

      console.log(`[WorkerNode:${this.workerId}] Fetching: ${target.source_name} [${target.adapter_type}]`);
      const result = await this.fetchWithRetry(adapter, target);

      await this.saveSnapshot(result, target);

      if (result.status === 'success') {
        await this.circuitBreaker.recordSuccess(domain);
        await this.queue.markSuccess(target.id, target.cadence_hours);
      } else {
        await this.circuitBreaker.recordFailure(domain);
        await this.queue.markFailure(target.id, result.error_message || `status: ${result.status}`, target.consecutive_failures);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[WorkerNode:${this.workerId}] Error processing ${target.source_name}:`, message);
      await this.circuitBreaker.recordFailure(domain);
      await this.queue.markFailure(target.id, message, target.consecutive_failures);
    }
  }

  private async saveSnapshot(result: ScraperResult, target: ScrapeTarget) {
    const { error } = await this.supabase.from('source_snapshots').insert({
      source_id: result.target_id,
      captured_url: target.base_url,
      captured_at: result.timestamp,
      captured_text: result.raw_content || null,
      raw_html_hash: result.content_hash || null,
      processing_status: result.status === 'success' ? 'pending_extraction' : 'failed',
      error_message: result.error_message || null,
      fetch_status: result.status === 'success' ? 'ok' : 'error',
    });

    if (error) {
      console.error(`[WorkerNode:${this.workerId}] Failed to save snapshot for ${result.target_id}:`, error.message);
    }
  }

  private async writeHeartbeat(status: string, lastError?: string) {
    const { error } = await this.supabase.from('worker_heartbeats').upsert({
      worker_id: this.workerId,
      status,
      last_seen_at: new Date().toISOString(),
      targets_processed_total: this.targetsProcessedTotal,
      last_error: lastError ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      // Don't let heartbeat-write failures take down the worker loop.
      console.error(`[WorkerNode:${this.workerId}] Heartbeat write failed:`, error.message);
    }
  }

  /**
   * Minimal liveness endpoint. Several container platforms (Cloud Run in
   * particular) require the container to listen on $PORT; this also gives
   * a plain `curl` health check on any host. Not started at all unless
   * start() is called — a one-off script invocation doesn't need it.
   */
  private startHealthServer() {
    const port = Number(process.env.PORT) || 8080;
    this.healthServer = http.createServer((req, res) => {
      if (req.url === '/healthz') {
        res.writeHead(this.isRunning ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          workerId: this.workerId,
          running: this.isRunning,
          targetsProcessedTotal: this.targetsProcessedTotal,
        }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    this.healthServer.listen(port, () => {
      console.log(`[WorkerNode:${this.workerId}] Health endpoint listening on :${port}/healthz`);
    });
  }

  private stopHealthServer() {
    this.healthServer?.close();
    this.healthServer = null;
  }
}
