// lib/intelligence-engine/orchestrator.ts
//
// Bridges the Vercel Cron environment into the full distributed crawling
// infrastructure (DistributedTaskQueue + CircuitBreaker + parallel batches).
//
// Column mapping (engine name → actual source_registry column):
//   base_url      ← source_url
//   country_code  ← iso (Alpha-2 → Alpha-3 via toIso3() in task-queue.ts)
//   adapter_type  ← adapter
//   cadence_hours ← crawl_cadence
//   tier          ← tier (1=primary regulator, 2=official publication,
//                          3=trade press, 4=community)
//
// Snapshot pipeline (correct path):
//   source_registry → source_snapshots (processing_status='pending_extraction')
//   → trg_promote_snapshot trigger → signals
//
// hv_import_staging is NOT used here — it is a workspace-scoped manual-import
// table that requires workspace_id + import_batch_id (no defaults). Passing
// only source_system + raw_payload causes silent insert failures.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { DistributedTaskQueue } from './queue/task-queue';
import { CircuitBreaker } from './queue/circuit-breaker';
import { HTMLDataAdapter } from './adapters/html-fetcher';
import { RSSDataAdapter } from './adapters/rss-fetcher';
import { APIDataAdapter } from './adapters/api-fetcher';
import { IDataAdapter, ScrapeTarget, ScraperResult } from './types';
import crypto from 'crypto';

const RETRYABLE_STATUS_PATTERN = /\b(429|500|502|503|504|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN)\b/i;
const CONCURRENCY = 10;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface ExtractionSummary {
  processed: number;
  changed: number;
  failed: number;
  circuitOpen: number;
}

export class IntelligenceOrchestrator {
  private supabase: SupabaseClient<any, any, 'api'>;
  private queue: DistributedTaskQueue;
  private circuitBreaker: CircuitBreaker;
  private htmlAdapter: HTMLDataAdapter;
  private rssAdapter: RSSDataAdapter;
  private apiAdapter: APIDataAdapter;
  private runId: string;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase credentials in env.');
    this.supabase = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } });
    this.queue = new DistributedTaskQueue(this.supabase);
    this.circuitBreaker = new CircuitBreaker(this.supabase);
    this.htmlAdapter = new HTMLDataAdapter();
    this.rssAdapter = new RSSDataAdapter();
    this.apiAdapter = new APIDataAdapter();
    this.runId = `cron-${crypto.randomUUID().slice(0, 8)}`;
  }

  /**
   * Acquire targets via the distributed task queue.
   * Uses acquire_crawl_targets RPC (FOR UPDATE SKIP LOCKED) — safe for
   * concurrent cron invocations without double-processing.
   */
  async getTargets(limit = 100): Promise<ScrapeTarget[]> {
    return this.queue.acquireTargets(limit, this.runId);
  }

  /**
   * Crawl a batch of targets in CONCURRENCY-wide parallel lanes.
   * Refreshes the circuit-breaker domain-lock snapshot once before the run
   * so all parallel workers share the same starting state.
   */
  async runExtraction(targets: ScrapeTarget[]): Promise<ExtractionSummary> {
    console.info(`[${this.runId}] Starting run — ${targets.length} targets, CONCURRENCY=${CONCURRENCY}`);
    await this.circuitBreaker.refresh();

    let changed = 0, failed = 0, circuitOpen = 0;

    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      const batch = targets.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map(t => this.processTarget(t)));
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.changed)      changed++;
          if (r.value.circuitOpen)  circuitOpen++;
          if (r.value.failed)       failed++;
        } else {
          failed++;
        }
      }
    }

    return { processed: targets.length, changed, failed, circuitOpen };
  }

  private selectAdapter(target: ScrapeTarget): IDataAdapter | null {
    switch (target.adapter_type) {
      case 'rss':           return this.rssAdapter;
      case 'api':           return this.apiAdapter;
      case 'html_snapshot': return this.htmlAdapter;
      default:              return null; // playwright_full — not available in Vercel serverless
    }
  }

  private async fetchWithRetry(
    adapter: IDataAdapter,
    target: ScrapeTarget,
    maxAttempts = 2,
  ): Promise<ScraperResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await adapter.fetch(target);
        if (result.status === 'success' || result.status === 'unchanged') return result;
        if (
          attempt < maxAttempts &&
          RETRYABLE_STATUS_PATTERN.test(result.error_message ?? '')
        ) {
          const waitMs =
            result.retry_after_seconds !== undefined
              ? Math.min(result.retry_after_seconds, 15) * 1000
              : 500 * attempt;
          await sleep(waitMs);
          continue;
        }
        return result;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts && RETRYABLE_STATUS_PATTERN.test(msg)) {
          await sleep(500 * attempt);
          continue;
        }
        throw err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  /**
   * Inject previous snapshot hash into target.metadata so adapters can
   * short-circuit (ETag / content-hash) without a second DB round-trip.
   */
  private async withPreviousHash(target: ScrapeTarget): Promise<ScrapeTarget> {
    const { data: last } = await this.supabase
      .from('source_snapshots')
      .select('raw_html_hash')
      .eq('source_id', target.id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousHash =
      last && typeof last.raw_html_hash === 'string' ? last.raw_html_hash : null;
    if (!previousHash) return target;

    return {
      ...target,
      metadata: {
        ...(target.metadata ?? {}),
        previous_hash: previousHash,
      },
    };
  }

  private async processTarget(
    target: ScrapeTarget,
  ): Promise<{ changed: boolean; failed: boolean; circuitOpen: boolean }> {
    let domain: string;
    try {
      domain = new URL(target.base_url).hostname;
    } catch {
      await this.queue.markFailure(target.id, 'Invalid URL format', target.consecutive_failures);
      return { changed: false, failed: true, circuitOpen: false };
    }

    if (this.circuitBreaker.isLocked(domain)) {
      console.log(`[${this.runId}] Circuit open for ${domain} — releasing lock`);
      await this.queue.releaseLock(target.id);
      return { changed: false, failed: false, circuitOpen: true };
    }

    // Enrich API (and other) targets with last content hash for early-abort.
    const enriched =
      target.adapter_type === 'api' ? await this.withPreviousHash(target) : target;

    let result: ScraperResult;
    try {
      if (target.adapter_type === 'playwright_full') {
        // Graceful degradation: many JS-rendered regulatory sites still serve
        // indexable server-side content. Attempt HTML adapter first; only fall
        // back to blocked if it yields insufficient content (<500 chars).
        const fallback = await this.fetchWithRetry(this.htmlAdapter, enriched);
        if (fallback.status === 'success' && (fallback.raw_content?.length ?? 0) > 500) {
          result = fallback;
        } else {
          result = {
            target_id: target.id,
            timestamp: new Date().toISOString(),
            raw_content: '',
            content_hash: '',
            status: 'blocked',
            error_message:
              'playwright_full: HTML fallback insufficient — requires WorkerNode daemon for full JS rendering.',
          };
        }
      } else {
        const adapter = this.selectAdapter(target);
        if (!adapter) {
          result = {
            target_id: target.id,
            timestamp: new Date().toISOString(),
            raw_content: '',
            content_hash: '',
            status: 'blocked',
            error_message: `No adapter for adapter_type "${target.adapter_type}".`,
          };
        } else {
          result = await this.fetchWithRetry(adapter, enriched);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      result = {
        target_id: target.id,
        timestamp: new Date().toISOString(),
        raw_content: '',
        content_hash: '',
        status: 'failed',
        error_message: message,
      };
    }

    const contentChanged = await this.saveSnapshot(result, target);

    // success AND unchanged both advance the crawl schedule without failure backoff.
    if (result.status === 'success' || result.status === 'unchanged') {
      await this.circuitBreaker.recordSuccess(domain);
      await this.queue.markSuccess(target.id, target.cadence_hours, contentChanged);
      console.log(
        `[${this.runId}] ✓ ${target.source_name} [${target.adapter_type}]${contentChanged ? ' (changed)' : ' (unchanged)'}`,
      );
      return { changed: contentChanged, failed: false, circuitOpen: false };
    } else {
      if (result.status !== 'blocked') {
        await this.circuitBreaker.recordFailure(domain);
      }
      await this.queue.markFailure(
        target.id,
        result.error_message || `status: ${result.status}`,
        target.consecutive_failures,
      );
      console.log(`[${this.runId}] ✗ ${target.source_name} → ${result.status}`);
      return { changed: false, failed: true, circuitOpen: false };
    }
  }

  /**
   * Persist a snapshot with diff metadata.
   *
   * Populates previous_hash + changed so the trg_promote_snapshot trigger and
   * downstream consumers can skip re-running AI extraction on identical pages.
   *
   * The snapshot with processing_status='pending_extraction' IS the queue for
   * the /api/cron/intelligence-extract pipeline — trg_promote_snapshot handles
   * promotion to signals automatically.
   */
  private async saveSnapshot(result: ScraperResult, target: ScrapeTarget): Promise<boolean> {
    const { data: last } = await this.supabase
      .from('source_snapshots')
      .select('raw_html_hash')
      .eq('source_id', target.id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousHash = last?.raw_html_hash ?? null;

    // Adapter-reported unchanged, or success with identical hash.
    const contentChanged =
      result.status === 'success' &&
      !!result.content_hash &&
      result.content_hash !== previousHash;

    if (result.status === 'unchanged') {
      // Record a lightweight crawl observation without queuing extraction.
      const { error } = await this.supabase.from('source_snapshots').insert({
        source_id:         result.target_id,
        captured_url:      target.base_url,
        captured_at:       result.timestamp,
        captured_text:     null,
        raw_html_hash:     result.content_hash || previousHash,
        processing_status: 'skipped_unchanged',
        error_message:     null,
        fetch_status:      'ok',
        previous_hash:     previousHash,
        changed:           false,
      });
      if (error) {
        // Column may not accept skipped_unchanged yet — fall back to failed-path metadata
        // without pending_extraction so we still don't re-run AI.
        console.warn(
          `[${this.runId}] unchanged snapshot insert soft-fail for ${result.target_id}:`,
          error.message,
        );
        await this.supabase.from('source_snapshots').insert({
          source_id:         result.target_id,
          captured_url:      target.base_url,
          captured_at:       result.timestamp,
          captured_text:     null,
          raw_html_hash:     result.content_hash || previousHash,
          processing_status: 'failed',
          error_message:     'unchanged (no extraction needed)',
          fetch_status:      'ok',
          previous_hash:     previousHash,
          changed:           false,
        });
      }
      return false;
    }

    const { error } = await this.supabase.from('source_snapshots').insert({
      source_id:         result.target_id,
      captured_url:      target.base_url,
      captured_at:       result.timestamp,
      captured_text:     result.raw_content || null,
      raw_html_hash:     result.content_hash || null,
      processing_status: result.status === 'success' ? 'pending_extraction' : 'failed',
      error_message:     result.error_message || null,
      fetch_status:      result.status === 'success' ? 'ok' : 'error',
      previous_hash:     previousHash,
      changed:           contentChanged,
    });

    if (error) {
      console.error(`[${this.runId}] Snapshot save failed for ${result.target_id}:`, error.message);
    }

    return contentChanged;
  }
}
