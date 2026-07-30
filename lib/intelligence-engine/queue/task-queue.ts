// lib/intelligence-engine/queue/task-queue.ts
// Column mapping (engine name → actual source_registry column):
//   base_url      ← source_url
//   country_code  ← iso (Alpha-2, converted to Alpha-3 via toIso3() — see
//                   lib/intelligence-engine/iso-codes.ts. Downstream Zod
//                   schemas expect Alpha-3; iso column is Alpha-2.)
//   adapter_type  ← adapter
//   cadence_hours ← crawl_cadence
// Queue-management columns added via migration:
//   crawl_allowed, next_crawl_at, locked_until, locked_by,
//   consecutive_failures, last_error_log, network_status

import { SupabaseClient } from '@supabase/supabase-js';
import { ScrapeTarget } from '../types';
import { toIso3 } from '../iso-codes';

interface SourceRegistryRow {
  id: string;
  source_url: string;
  iso: string | null;
  source_name: string;
  adapter: string | null;
  crawl_cadence: string | null;
  consecutive_failures: number | null;
  metadata?: Record<string, unknown> | null;
}

// source_registry.crawl_cadence holds either a named cadence label or a raw
// numeric-hours string (both forms exist live: 'daily'/'weekly'/'monthly'/
// 'quarterly'/'annual' as well as '12'/'24'/'48'/'72'). Bug history: this
// used to be hardcoded to 24 in mapRow() below regardless of the source's
// actual configured cadence, which forced every successfully-crawled source
// back into the "due" queue every 24h — including the 40% of sources
// configured weekly/monthly/quarterly/annual. At registry scale (1000+
// active sources) that manufactured re-crawl demand exceeded real cron
// throughput, so the "due" queue stayed permanently over-full and newly
// added sources got crowded out indefinitely, never reaching the front of
// the ORDER BY next_crawl_at ASC queue. Root-caused 2026-07-02.
const NAMED_CADENCE_HOURS: Record<string, number> = {
  daily:     24,
  weekly:    24 * 7,
  monthly:   24 * 30,
  quarterly: 24 * 90,
  annual:    24 * 365,
};

export function parseCadenceHours(raw: string | null): number {
  if (!raw) return 24; // unset — safe default, matches prior fallback behavior
  const named = NAMED_CADENCE_HOURS[raw.trim().toLowerCase()];
  if (named !== undefined) return named;
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return 24; // unrecognized format — fall back rather than let a bad value wedge the row
}

export class DistributedTaskQueue {
  constructor(private supabase: SupabaseClient<any, any, 'api'>) {}

  /**
   * Acquire a batch of targets due for crawling.
   * Tries the acquire_crawl_targets RPC first; falls back to
   * a manual select-then-update if the RPC is unavailable.
   */
  async acquireTargets(limit: number, workerId: string): Promise<ScrapeTarget[]> {
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('acquire_crawl_targets', {
      p_limit: limit,
      p_worker_id: workerId,
    });

    if (!rpcError && rpcData) {
      return (rpcData as SourceRegistryRow[]).map(this.mapRow);
    }

    return this.fallbackAcquire(limit, workerId);
  }

  private mapRow(row: SourceRegistryRow): ScrapeTarget {
    return {
      id:            row.id,
      country_code:  toIso3(row.iso),
      source_name:   row.source_name,
      base_url:      row.source_url,
      adapter_type:  (row.adapter || 'html_snapshot') as "html_snapshot" | "rss" | "api" | "playwright_full",
      cadence_hours: parseCadenceHours(row.crawl_cadence),
      consecutive_failures: row.consecutive_failures ?? 0,
      metadata: row.metadata ?? undefined,
    };
  }

  private async fallbackAcquire(limit: number, workerId: string): Promise<ScrapeTarget[]> {
    const now = new Date().toISOString();

    const { data: targets } = await this.supabase
      .from('source_registry')
      .select('id')
      .eq('is_active', true)
      .eq('crawl_allowed', true)
      .or(`next_crawl_at.is.null,next_crawl_at.lte.${now}`)
      .or(`locked_until.is.null,locked_until.lt.${now}`)
      .limit(limit);

    if (!targets || targets.length === 0) return [];

    const ids = (targets as Array<{ id: string }>).map((t) => t.id);
    const leaseTime = new Date(Date.now() + 5 * 60000).toISOString();

    const { data: locked, error } = await this.supabase
      .from('source_registry')
      .update({ locked_by: workerId, locked_until: leaseTime })
      .in('id', ids)
      .select('id, source_url, iso, source_name, adapter, crawl_cadence, consecutive_failures, metadata');

    if (error || !locked) return [];
    return (locked as SourceRegistryRow[]).map(this.mapRow);
  }

  /**
   * Release lock and schedule next crawl.
   *
   * Yield-aware scheduling: if content did not change, back off by 1.5× the
   * base cadence so infrequently-updating sources don't monopolise crawl slots.
   * Content that changes on every crawl gets the full base cadence.
   * Cap at 4× base cadence so no source ever goes truly dark.
   */
  async markSuccess(targetId: string, cadenceHours: number, contentChanged = true) {
    const effectiveHours = contentChanged
      ? cadenceHours
      : Math.min(cadenceHours * 1.5, cadenceHours * 4);
    const nextCrawl = new Date(Date.now() + effectiveHours * 3600000).toISOString();
    await this.supabase
      .from('source_registry')
      .update({
        next_crawl_at:         nextCrawl,
        locked_by:             null,
        locked_until:          null,
        consecutive_failures:  0,
        network_status:        'online',
      })
      .eq('id', targetId);
  }

  /** Exponential backoff on failure (1h → 256h max). */
  async markFailure(targetId: string, error: string, consecutiveFailures: number) {
    const newFailures   = consecutiveFailures + 1;
    const backoffHours  = Math.pow(2, Math.min(newFailures, 8));
    const nextCrawl     = new Date(Date.now() + backoffHours * 3600000).toISOString();
    const networkStatus = newFailures > 5 ? 'offline' : 'degraded';

    await this.supabase
      .from('source_registry')
      .update({
        next_crawl_at:         nextCrawl,
        locked_by:             null,
        locked_until:          null,
        consecutive_failures:  newFailures,
        last_error_log:        error,
        network_status:        networkStatus,
      })
      .eq('id', targetId);
  }

  /**
   * Release the lease without touching consecutive_failures/next_crawl_at.
   * For cases where the target itself didn't fail — e.g. its domain's
   * circuit breaker is open because a *different* source on the same
   * domain has been failing. Penalizing this source's own backoff schedule
   * for a neighbor's failures would be wrong; it should simply be picked
   * up again on the next poll cycle once the domain circuit closes.
   */
  async releaseLock(targetId: string) {
    await this.supabase
      .from('source_registry')
      .update({ locked_by: null, locked_until: null })
      .eq('id', targetId);
  }
}
