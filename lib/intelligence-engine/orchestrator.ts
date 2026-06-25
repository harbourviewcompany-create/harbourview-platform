// lib/intelligence-engine/orchestrator.ts
// Column mapping (engine name → actual source_registry column):
//   base_url      ← source_url
//   country_code  ← iso
//   adapter_type  ← adapter  (DB values: html_snapshot | rss | api; normalised below)
//   cadence_hours ← crawl_cadence  (stored as text: "daily" | "hourly" | "weekly" | "monthly")
// source_snapshots: raw_html → captured_text, content_hash → raw_html_hash, error_log → error_message
// hv_import_staging: source_id → source_record_id, country_code → proposed_country_iso,
//                    raw_text → raw_payload (jsonb), processing_status → status

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScrapeTarget, ScraperResult, IDataAdapter } from './types';
import { HTMLDataAdapter } from './adapters/html-fetcher';
import { RSSDataAdapter } from './adapters/rss-fetcher';
import { APIDataAdapter } from './adapters/api-fetcher';

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
  consecutive_failures: number | null;
}

// Normalise the raw `adapter` value stored in source_registry to the canonical
// adapter_type enum understood by the engine. The DB only ever stores
// html_snapshot | rss | api today (0 rows use playwright_full currently).
function normaliseAdapterType(raw: string | null): ScrapeTarget['adapter_type'] {
  switch ((raw ?? '').toLowerCase()) {
    case 'playwright_full': return 'playwright_full';
    case 'rss':             return 'rss';
    case 'api':              return 'api';
    case 'html_snapshot':
    default:                return 'html_snapshot';
  }
}

// Parse crawl_cadence text → integer hours.
function parseCadenceHours(raw: string | null): number {
  switch ((raw ?? '').toLowerCase()) {
    case 'hourly':  return 1;
    case 'daily':   return 24;
    case 'weekly':  return 168;
    case 'monthly': return 720;
    default:        return 24; // safe default for unrecognised values
  }
}

export class IntelligenceOrchestrator {
  private supabase: SupabaseClient;
  private htmlAdapter: HTMLDataAdapter;
  private rssAdapter: RSSDataAdapter;
  private apiAdapter: APIDataAdapter;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase credentials in env.');
    this.supabase = createClient(url, key, { auth: { persistSession: false } });
    this.htmlAdapter = new HTMLDataAdapter();
    this.rssAdapter = new RSSDataAdapter();
    this.apiAdapter = new APIDataAdapter();
  }

  /** Pull targets due for crawling from source_registry. */
  async getTargets(limit = 100): Promise<ScrapeTarget[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('source_registry')
      .select('id, source_url, iso, source_name, adapter, crawl_cadence, is_active, crawl_allowed, next_crawl_at, locked_until, consecutive_failures')
      .eq('is_active', true)
      .eq('crawl_allowed', true)
      .or(`next_crawl_at.is.null,next_crawl_at.lte.${now}`)
      .order('next_crawl_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch targets: ${error.message}`);

    return (data as SourceRegistryRow[] || []).map((row) => ({
      id: row.id,
      country_code: row.iso || 'GLOBAL',
      source_name: row.source_name,
      base_url: row.source_url,
      adapter_type: normaliseAdapterType(row.adapter),
      cadence_hours: parseCadenceHours(row.crawl_cadence),
      consecutive_failures: row.consecutive_failures ?? 0,
    }));
  }

  /** Execute scraping run on targets. */
  async runExtraction(targets: ScrapeTarget[]) {
    console.log(`Starting ingestion run for ${targets.length} targets...`);

    for (const target of targets) {
      console.log(`[${target.country_code}] Scraping ${target.source_name} via ${target.adapter_type}...`);
      let result: ScraperResult;

      try {
        // Route to the correct adapter based on adapter_type.
        // playwright_full has 0 live rows today and no headless-browser
        // capability exists in this environment — report an honest `blocked`
        // result rather than silently falling back to a fetch method that
        // can't render JS.
        if (target.adapter_type === 'playwright_full') {
          result = {
            target_id: target.id,
            timestamp: new Date().toISOString(),
            raw_content: '',
            content_hash: '',
            status: 'blocked',
            error_message: 'No adapter implemented for adapter_type "playwright_full" — headless-browser rendering is not available in this environment yet.',
          };
        } else {
          const adapter: IDataAdapter =
            target.adapter_type === 'rss' ? this.rssAdapter :
            target.adapter_type === 'api' ? this.apiAdapter :
            this.htmlAdapter;

          result = await adapter.fetch(target);
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

      await this.saveSnapshot(result, target);

      if (result.status === 'success') {
        await this.queueForAIProcessing(result, target);
      }

      // Schedule the next attempt. On success, reset to the normal cadence
      // and clear the failure streak. On failure (or `blocked`), back off
      // exponentially (1h -> 256h, capped at 8 doublings) instead of
      // retrying on the same cadence regardless of how many times in a row
      // it's failed — consecutive_failures/network_status/last_error_log
      // already existed on source_registry but nothing was writing to them.
      if (result.status === 'success') {
        await this.supabase
          .from('source_registry')
          .update({
            next_crawl_at: new Date(Date.now() + target.cadence_hours * 3600000).toISOString(),
            locked_by: null,
            locked_until: null,
            consecutive_failures: 0,
            network_status: 'online',
            last_error_log: null,
          })
          .eq('id', target.id);
      } else {
        const newFailures = target.consecutive_failures + 1;
        const backoffHours = Math.pow(2, Math.min(newFailures, 8));
        await this.supabase
          .from('source_registry')
          .update({
            next_crawl_at: new Date(Date.now() + backoffHours * 3600000).toISOString(),
            locked_by: null,
            locked_until: null,
            consecutive_failures: newFailures,
            network_status: newFailures > 5 ? 'offline' : 'degraded',
            last_error_log: result.error_message || `status: ${result.status}`,
          })
          .eq('id', target.id);
      }
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
