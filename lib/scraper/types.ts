/**
 * Platform Core: Scraper Pipeline Types
 * Strict standard for 192+ country global data ingestion.
 */

export type SourceType = 'regulatory' | 'trade' | 'market' | 'scientific' | 'other';
export type AdapterType = 'html_diff' | 'rss' | 'json_api' | 'playwright_full' | 'pdf_parse';
export type ImpactLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * Core configuration representing a specific national/international intelligence source.
 */
export interface ScraperConfig {
  id: string; // UUID
  country_code: string; // ISO 3166-1 alpha-3
  source_name: string;
  base_url: string;
  source_type: SourceType;
  adapter_type: AdapterType;
  cadence_hours: number; // Polling frequency
  is_active: boolean;
  metadata?: Record<string, unknown>; // Optional params for specific adapter needs
}

/**
 * Standardized record emitted by the AI Entity/Feature extraction phase.
 */
export interface IntelligenceRecord {
  id: string; // UUID
  source_id: string; // FK to ScraperConfig.id
  country_code: string; // ISO 3166-1 alpha-3
  timestamp: string; // ISO Date String
  title: string;
  summary: string;
  signal_type: SourceType | 'Watchlist';
  impact_level: ImpactLevel;
  entities_mentioned: string[];
  raw_content_reference: string; // MD5/SHA256 Content hash for diffing/storage
  
  // Key Cannabis Operating Matrix Dimensions
  medical_impact?: boolean;
  adult_use_impact?: boolean;
  industrial_impact?: boolean;

  // Granular Operational Details
  regulatory_changes?: string[];
  licensing_updates?: string[];
  trade_route_information?: string[];
}

/**
 * Shared contract for global source initialization and registry lookup.
 */
export interface SourceRegistry {
  register(config: ScraperConfig): void;
  get(id: string): ScraperConfig | undefined;
  getAll(): ScraperConfig[];
  getByCountry(countryCode: string): ScraperConfig[];
  getByType(sourceType: SourceType): ScraperConfig[];
  loadBulk(configs: ScraperConfig[]): void;
}
