/**
 * HarbourView Intelligence Engine
 * 
 * Global Data Ingestion Orchestrator for 192+ Countries.
 * This engine handles the scheduling, crawling, and AI-extraction
 * of regulatory and market intelligence.
 */

import { z } from 'zod';

// --- Types & Schemas ---

export const ScrapeTargetSchema = z.object({
  id: z.string(),
  country_code: z.string().length(3), // ISO Alpha-3
  source_name: z.string(),
  base_url: z.string(),
  cadence_hours: z.number().default(24),
  // Confirmed live via source_registry.adapter (2026-06-21): values in production are
  // 'html_snapshot' (530 rows), 'rss' (190 rows), 'api' (7 rows). 'playwright_full' is
  // reserved for future JS-rendered sources — 0 live rows use it today, and the adapter
  // backing it (adapters/playwright-fetcher.ts) is a mock pending real implementation.
  adapter_type: z.enum(['html_snapshot', 'rss', 'api', 'playwright_full']),
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
