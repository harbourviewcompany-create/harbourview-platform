import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScrapeTarget, ScraperResult } from './types';
import { HTMLDataAdapter } from './adapters/html-fetcher';

export class IntelligenceOrchestrator {
  private supabase: SupabaseClient;
  private htmlAdapter: HTMLDataAdapter;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials in env.');
    }

    // Using service role key for backend ingestion engine
    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    this.htmlAdapter = new HTMLDataAdapter();
  }

  /**
   * 1. Pull targeted sources from `source_registry`
   */
  async getTargets(limit = 100): Promise<ScrapeTarget[]> {
    const { data, error } = await this.supabase
      .from('source_registry')
      .select('*')
      .eq('is_active', true)
      .eq('crawl_allowed', true)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch targets: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      country_code: row.country_code || 'GLOBAL',
      source_name: row.source_name,
      base_url: row.base_url,
      adapter_type: row.adapter_type || 'html_diff',
      cadence_hours: row.cadence_hours || 24,
    }));
  }

  /**
   * 2. Execute scraping run on targets
   */
  async runExtraction(targets: ScrapeTarget[]) {
    console.log(`Starting ingestion run for ${targets.length} targets...`);

    for (const target of targets) {
      console.log(`[${target.country_code}] Scraping ${target.source_name}...`);

      // Determine adapter (could expand to proxy/playwright adapters here)
      let result: ScraperResult;
      
      try {
        result = await this.htmlAdapter.fetch(target);
      } catch (err: any) {
         result = {
            target_id: target.id,
            timestamp: new Date().toISOString(),
            raw_content: '',
            content_hash: '',
            status: 'failed',
            error_message: err.message
         }
      }

      await this.saveSnapshot(result);
      
      // If we have actual content change, push to the extraction pipeline (HuggingFace)
      if (result.status === 'success') {
        await this.queueForAIProcessing(result, target);
      }
    }
  }

  /**
   * 3. Save to source_snapshots
   */
  private async saveSnapshot(result: ScraperResult) {
    const { error } = await this.supabase.from('source_snapshots').insert({
      source_id: result.target_id,
      captured_at: result.timestamp,
      raw_html: result.raw_content,
      content_hash: result.content_hash,
      processing_status: result.status === 'success' ? 'pending_extraction' : 'failed',
      error_log: result.error_message || null,
    });

    if (error) {
      console.error(`=> Failed to save snapshot for ${result.target_id}:`, error.message);
    } else {
      console.log(`=> Snapshot saved. Status: ${result.status}`);
    }
  }

  /**
   * 4. Stage to `hv_import_staging` for the HF AI Layer
   */
  private async queueForAIProcessing(result: ScraperResult, target: ScrapeTarget) {
    // Only queue if the content hash hasn't already been processed recently
    const { data: existingHash } = await this.supabase
      .from('hv_import_staging')
      .select('id')
      .eq('content_hash', result.content_hash)
      .single();

    if (existingHash) {
      console.log(`=> Content unchanged (Hash: ${result.content_hash.substring(0, 8)}). Skipping staging.`);
      return;
    }

    const { error } = await this.supabase.from('hv_import_staging').insert({
      source_id: target.id,
      country_code: target.country_code,
      content_hash: result.content_hash,
      raw_text: result.raw_content.slice(0, 50000), // Safety clip before extraction
      processing_status: 'staged',
    });

    if (error) {
      console.error(`=> Failed to stage extraction for ${target.id}:`, error.message);
    } else {
      console.log(`=> Staged for AI Extraction pipeline.`);
    }
  }
}
