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
// - html_snapshot : lightweight HTML fetch (HTMLDataAdapter)
// - rss           : RSS/Atom feed, parsed and validated by RSSDataAdapter
// - api           : JSON REST endpoint, parsed and validated by APIDataAdapter
// - playwright_full : headless browser — no adapter exists yet (0 live rows
//   use this today); orchestrator reports an honest `blocked` result instead
//   of silently falling back to a fetch method that can't render JS.
// DB source_registry.adapter stores these as plain text; the orchestrator
// normalises before building a ScrapeTarget.
export const ScrapeTargetSchema = z.object({
  id: z.string(),
  country_code: z.string().length(3), // ISO Alpha-3
  source_name: z.string(),
  base_url: z.string(),
  cadence_hours: z.number().default(24),
  adapter_type: z.enum(['html_snapshot', 'rss', 'api', 'playwright_full']),
  consecutive_failures: z.number().default(0),
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
  http_status: z.number().optional(),
  retry_after_seconds: z.number().optional(),
  /** Response ETag when present; orchestrator may persist as metadata.last_etag. */
  etag: z.string().optional(),
});

export type ScraperResult = z.infer<typeof ScraperResultSchema>;

// --- Engine Interface ---

export interface IDataAdapter {
  fetch(target: ScrapeTarget): Promise<ScraperResult>;
}

export interface IExtractionStrategy {
  extract(rawResult: ScraperResult): Promise<unknown>;
}
