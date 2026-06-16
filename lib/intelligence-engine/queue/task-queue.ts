import { SupabaseClient } from '@supabase/supabase-js';
import { ScrapeTarget } from '../types';

export class DistributedTaskQueue {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Acquires a batch of targets that are due for scraping.
   * Simulates a row-level lock by setting a lease time (locked_until).
   * In a distributed system, this prevents multiple workers from crawling the same source simultaneously.
   */
  async acquireTargets(limit: number, workerId: string): Promise<ScrapeTarget[]> {
    // Attempt an atomic RPC if it exists in the HarbourView DB
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('acquire_crawl_targets', {
       p_limit: limit,
       p_worker_id: workerId
    });

    if (!rpcError && rpcData) {
      return rpcData;
    }

    // Fallback to update + returning lock pattern
    return this.fallbackAcquire(limit, workerId);
  }

  private async fallbackAcquire(limit: number, workerId: string): Promise<ScrapeTarget[]> {
    const now = new Date().toISOString();
    
    // 1. Find target IDs
    // We assume presence of a virtual 'next_crawl_at' and 'locked_until' column for the queue
    const { data: targets } = await this.supabase
      .from('source_registry')
      .select('id')
      .eq('is_active', true)
      .eq('crawl_allowed', true)
      .lte('next_crawl_at', now)
      .or(`locked_until.is.null,locked_until.lt.${now}`)
      .limit(limit);

    if (!targets || targets.length === 0) return [];

    const ids = targets.map((t: any) => t.id);
    const leaseTime = new Date(Date.now() + 5 * 60000).toISOString(); // 5 min lease

    // 2. Lock them atomically
    const { data: lockedTargets, error } = await this.supabase
      .from('source_registry')
      .update({ locked_by: workerId, locked_until: leaseTime })
      .in('id', ids)
      .select('*');

    if (error || !lockedTargets) return [];

    return lockedTargets.map((t: any) => ({
      id: t.id,
      country_code: t.country_code || 'GLOBAL',
      source_name: t.source_name,
      base_url: t.base_url,
      adapter_type: t.adapter_type || 'html_diff',
      cadence_hours: t.cadence_hours || 24,
    }));
  }

  /**
   * Releases lock and sets the next crawl time based on standard cadence.
   */
  async markSuccess(targetId: string, cadenceHours: number) {
    const nextCrawl = new Date(Date.now() + cadenceHours * 3600000).toISOString();
    await this.supabase
      .from('source_registry')
      .update({ 
        next_crawl_at: nextCrawl, 
        locked_by: null, 
        locked_until: null,
        consecutive_failures: 0,
        network_status: 'online'
      })
      .eq('id', targetId);
  }

  /**
   * Handles failure through exponential backoff logic to prevent hammering dead links.
   */
  async markFailure(targetId: string, error: string, consecutiveFailures: number) {
    // Exponential backoff strategy (1h, 2h, 4h, 8h...)
    const newFailures = consecutiveFailures + 1;
    const backoffHours = Math.pow(2, Math.min(newFailures, 8)); // Max 256h backoff
    
    let nextCrawl = new Date(Date.now() + backoffHours * 3600000).toISOString();
    let networkStatus = newFailures > 5 ? 'offline' : 'degraded';
    
    await this.supabase
      .from('source_registry')
      .update({
        next_crawl_at: nextCrawl,
        locked_by: null,
        locked_until: null,
        consecutive_failures: newFailures,
        last_error_log: error,
        network_status: networkStatus
      })
      .eq('id', targetId);
  }
}
