// lib/intelligence-engine/queue/task-queue.ts
// Column mapping (engine name → actual source_registry column):
//   base_url      ← source_url
//   country_code  ← iso
//   adapter_type  ← adapter
//   cadence_hours ← crawl_cadence
// Queue-management columns added via migration:
//   crawl_allowed, next_crawl_at, locked_until, locked_by,
//   consecutive_failures, last_error_log, network_status

import { SupabaseClient } from '@supabase/supabase-js';
import { ScrapeTarget } from '../types';

interface SourceRegistryRow {
  id: string;
  source_url: string;
  iso: string | null;
  source_name: string;
  adapter: string | null;
  crawl_cadence: string | null;
}

export class DistributedTaskQueue {
  constructor(private supabase: SupabaseClient) {}

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
      country_code:  row.iso || 'GLOBAL',
      source_name:   row.source_name,
      base_url:      row.source_url,
      adapter_type:  row.adapter || 'html_diff',
      cadence_hours: 24,
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
      .select('id, source_url, iso, source_name, adapter, crawl_cadence');

    if (error || !locked) return [];
    return (locked as SourceRegistryRow[]).map(this.mapRow);
  }

  /** Release lock and schedule next crawl. */
  async markSuccess(targetId: string, cadenceHours: number) {
    const nextCrawl = new Date(Date.now() + cadenceHours * 3600000).toISOString();
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
}
