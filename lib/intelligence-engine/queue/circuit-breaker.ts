/**
 * Distributed Circuit Breaker
 *
 * Prevents the scraper fleet from hammering origin domains that are
 * rate-limiting, throwing 500s, or have WAF blocks.
 *
 * Replaces a previous in-process-Map implementation: that version could
 * not coordinate across the horizontally-scaled worker instances this
 * system is designed to run as (each instance had its own, independent
 * failure count and lockout state for the same domain). State now lives in
 * crawl_domain_circuit_state, shared by every WorkerNode instance via
 * Supabase.
 *
 * To avoid a DB round trip on every single target check within a batch,
 * call refresh() once at the start of each processBatch() cycle; isLocked()
 * then reads from that in-memory snapshot for the rest of the cycle.
 * recordFailure()/recordSuccess() still write through immediately, since
 * those are real state transitions, not just reads.
 */

import { SupabaseClient } from '@supabase/supabase-js';

const MAX_FAILURES = 3;
const LOCKOUT_DURATION_MS = 1000 * 60 * 15; // 15 minutes

export class CircuitBreaker {
  private lockedDomains: Set<string> = new Set();
  private lastRefreshedAt = 0;

  constructor(private supabase: SupabaseClient) {}

  /** Re-sync the in-memory lockout snapshot from the shared table. */
  async refresh(): Promise<void> {
    const { data, error } = await this.supabase
      .from('crawl_domain_circuit_state')
      .select('domain')
      .gt('locked_until', new Date().toISOString());

    if (error) {
      console.error('[CircuitBreaker] refresh failed, keeping previous snapshot:', error.message);
      return;
    }

    this.lockedDomains = new Set((data ?? []).map((row: { domain: string }) => row.domain));
    this.lastRefreshedAt = Date.now();
  }

  /** Synchronous check against the last refresh() snapshot. */
  isLocked(domain: string): boolean {
    return this.lockedDomains.has(domain);
  }

  /** How stale the in-memory snapshot is, for logging/diagnostics. */
  snapshotAgeMs(): number {
    return Date.now() - this.lastRefreshedAt;
  }

  async recordFailure(domain: string): Promise<void> {
    const { data: existing } = await this.supabase
      .from('crawl_domain_circuit_state')
      .select('consecutive_failures')
      .eq('domain', domain)
      .maybeSingle();

    const nextCount = (existing?.consecutive_failures ?? 0) + 1;
    const shouldLock = nextCount >= MAX_FAILURES;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

    const { error } = await this.supabase.from('crawl_domain_circuit_state').upsert({
      domain,
      consecutive_failures: nextCount,
      locked_until: lockedUntil,
      last_failure_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`[CircuitBreaker] failed to record failure for ${domain}:`, error.message);
      return;
    }

    if (shouldLock) {
      console.warn(`[CircuitBreaker] domain ${domain} locked out for ${LOCKOUT_DURATION_MS / 60000}min (shared across all worker instances).`);
      this.lockedDomains.add(domain);
    }
  }

  async recordSuccess(domain: string): Promise<void> {
    const { error } = await this.supabase
      .from('crawl_domain_circuit_state')
      .upsert({
        domain,
        consecutive_failures: 0,
        locked_until: null,
        last_success_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`[CircuitBreaker] failed to record success for ${domain}:`, error.message);
      return;
    }

    this.lockedDomains.delete(domain);
  }
}
