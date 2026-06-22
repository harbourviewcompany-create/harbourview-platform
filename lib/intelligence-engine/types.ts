/**
 * HarbourView Intelligence Engine
 * 
 * Global Data Ingestion Orchestrator for 192+ Countries.
 * This engine handles the scheduling, crawling, and AI-extraction
 * of regulatory and market intelligence.
 */

import { z } from 'zod';

// --- Types & Schemas ---

// Canonical adapter type values understood by the engine.
// - html_snapshot / html_diff : lightweight HTML fetch (HTMLDataAdapter)
// - rss                       : RSS/Atom feed — parsed as text by HTMLDataAdapter until a
//                               dedicated RSS adapter is built
// - api / json_api            : JSON REST endpoint — fetched as text by HTMLDataAdapter until
//                               a dedicated JSON adapter is built
// - playwright_full           : headless browser (PlaywrightDataAdapter)
// DB source_registry.adapter stores these as plain text; the orchestrator normalises before
// building a ScrapeTarget so both 'html_snapshot' and 'html_diff' route to HTMLDataAdapter.
export const ScrapeTargetSchema = z.object({
  id: z.string(),
  country_code: z.string().length(3), // ISO Alpha-3
  source_name: z.string(),
  base_url: z.string(),
  cadence_hours: z.number().default(24),
  adapter_type: z.enum(['html_snapshot', 'html_diff', 'rss', 'api', 'json_api', 'playwright_full']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ScrapeTarget = z.infer<typeof ScrapeTargetSchema>;

export const ScraperResultSchema = z.object({
  target_id: z.string(),
  timestamp: z.string(),
  raw_content: z.string(),
  content_hash: z.string(),
  status: z.enum(['success', 'failed', 'unchanged', 'blocked']),
  error_message: z.string().optional(),
});

export type ScraperResult = z.infer<typeof ScraperResultSchema>;

// --- Engine Interface ---

export interface IDataAdapter {
  fetch(target: ScrapeTarget): Promise<ScraperResult>;
}

export interface IExtractionStrategy {
  extract(rawResult: ScraperResult): Promise<unknown>;
}
