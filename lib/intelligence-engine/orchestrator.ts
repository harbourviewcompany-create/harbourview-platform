// lib/intelligence-engine/orchestrator.ts
// Column mapping (engine name → actual source_registry column):
//   base_url      ← source_url
//   country_code  ← iso
//   adapter_type  ← adapter
//   cadence_hours ← crawl_cadence  (stored as text e.g. "daily", "hourly" — defaulted to 24h)
// source_snapshots: raw_html → captured_text, content_hash → raw_html_hash, error_log → error_message
// hv_import_staging: source_id → source_record_id, country_code → proposed_country_iso,
//                    raw_text → raw_payload (jsonb), processing_status → status

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScrapeTarget, ScraperResult } from './types';
import { HTMLDataAdapter } from './adapters/html-fetcher';
import { PlaywrightDataAdapter } from './adapters/playwright-fetcher';

interface SourceRegistryRow {
  id: string;
  source_url: string;
  iso: string | null;
  source_name: string;
  adapter: string | null;
  crawl_cadence: string | null;
  is_active: boolean;
  crawl_allowed: boolean;
  next_crawl_at: string | null;
  locked_until: string | null;
}

export class IntelligenceOrchestrator {
  private supabase: SupabaseClient;
  private htmlAdapter: HTMLDataAdapter;
  // NOTE: PlaywrightDataAdapter is currently a mock (see adapters/playwright-fetcher.ts).
  // Routing playwright_full targets here is correct, but until that adapter has a real
  // headless-browser implementation, any such target will "succeed" with placeholder
  // content rather than failing loudly. 0 live source_registry rows use playwright_full
  // today, so this is a documented future-readiness gap, not an active regression.
  private playwrightAdapter: PlaywrightDataAdapter;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase credentials in env.');
    this.supabase = createClient(url, key, { auth: { persistSession: false } });
    this.htmlAdapter = new HTMLDataAdapter();
    this.playwrightAdapter = new PlaywrightDataAdapter();
  }

  /** Pull targets due for crawling from source_registry. */
  async getTargets(limit = 100): Promise<ScrapeTarget[]> {
    const { data, error } = await this.supabase
      .from('source_registry')
      .select('id, source_url, iso, source_name, adapter, crawl_cadence, is_active, crawl_allowed, next_crawl_at, locked_until')
      .eq('is_active', true)
      .eq('crawl_allowed', true)
      .limit(limit);

    if (error) throw new Error(`Failed to fetch targets: ${error.message}`);

    return (data as SourceRegistryRow[] || []).map((row) => ({
      id: row.id,
      country_code: row.iso || 'GLOBAL',
      source_name: row.source_name,
      base_url: row.source_url,
      adapter_type: (row.adapter || 'html_snapshot') as "html_snapshot" | "rss" | "api" | "playwright_full",
      cadence_hours: row.crawl_cadence ? 24 : 24, // cadence stored as text; default 24h
    }));
  }

  /** Execute scraping run on targets. */
  async runExtraction(targets: ScrapeTarget[]) {
    console.log(`Starting ingestion run for ${targets.length} targets...`);

    for (const target of targets) {
      console.log(`[${target.country_code}] Scraping ${target.source_name} [${target.adapter_type}]...`);
      let result: ScraperResult;

      // Route by adapter_type. html_snapshot/rss/api are all plain-HTTP-GET fetches at
      // this layer (parsing/extraction differences belong downstream, not here) —
      // playwright_full is the only type requiring a different fetch mechanism.
      const adapter = target.adapter_type === 'playwright_full' ? this.playwrightAdapter : this.htmlAdapter;

      try {
        result = await adapter.fetch(target);
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

      await this.saveSnapshot(result, target);

      if (result.status === 'success') {
        await this.queueForAIProcessing(result, target);
      }

      // Advance next_crawl_at so this target isn't immediately re-acquired
      const nextCrawl = new Date(Date.now() + 24 * 3600000).toISOString();
      await this.supabase
        .from('source_registry')
        .update({ next_crawl_at: nextCrawl, locked_by: null, locked_until: null })
        .eq('id', target.id);
    }
  }

  /** Save raw snapshot to source_snapshots. */
  private async saveSnapshot(result: ScraperResult, target: ScrapeTarget) {
    const { error } = await this.supabase.from('source_snapshots').insert({
      source_id:          result.target_id,
      captured_url:       target.base_url,
      captured_at:        result.timestamp,
      captured_text:      result.raw_content || null,   // raw_html → captured_text
      raw_html_hash:      result.content_hash || null,  // content_hash → raw_html_hash
      processing_status:  result.status === 'success' ? 'pending_extraction' : 'failed',
      error_message:      result.error_message || null, // error_log → error_message
      fetch_status:       result.status === 'success' ? 'ok' : 'error',
    });

    if (error) {
      console.error(`=> Failed to save snapshot for ${result.target_id}:`, error.message);
    } else {
      console.log(`=> Snapshot saved. Status: ${result.status}`);
    }
  }

  /** Stage changed content to hv_import_staging for AI extraction. */
  private async queueForAIProcessing(result: ScraperResult, target: ScrapeTarget) {
    // Dedup by content hash
    const { data: existingHash } = await this.supabase
      .from('hv_import_staging')
      .select('id')
      .eq('content_hash', result.content_hash)
      .maybeSingle();

    if (existingHash) {
      console.log(`=> Content unchanged (hash: ${result.content_hash.substring(0, 8)}). Skipping.`);
      return;
    }

    const { error } = await this.supabase.from('hv_import_staging').insert({
      source_record_id:   target.id,                          // source_id → source_record_id
      source_url:         target.base_url,
      source_system:      'intelligence_engine',
      proposed_country_iso: target.country_code,             // country_code → proposed_country_iso
      content_hash:       result.content_hash,
      raw_payload:        { text: result.raw_content.slice(0, 50000) }, // raw_text → raw_payload (jsonb)
      status:             'staged',                           // processing_status → status
    });

    if (error) {
      console.error(`=> Failed to stage extraction for ${target.id}:`, error.message);
    } else {
      console.log(`=> Staged for AI extraction pipeline.`);
    }
  }
}
