import { z } from 'zod';
import { SourceRegistry, ScraperConfig, SourceType } from './types';

export const ScraperSourceConfigSchema = z.object({
  id: z.string().uuid(),
  country_code: z.string().length(3), // ISO 3166-1 alpha-3
  source_name: z.string(),
  base_url: z.string().url(),
  source_type: z.enum(['regulatory', 'trade', 'market', 'scientific', 'other']),
  adapter_type: z.enum(['html_diff', 'rss', 'json_api', 'playwright_full', 'pdf_parse']),
  cadence_hours: z.number().int().min(1).default(24),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional(),
});

export class SourceRegistryImpl implements SourceRegistry {
  private sources: Map<string, ScraperConfig> = new Map();

  /**
   * Registers a new source in the registry.
   */
  register(source: ScraperConfig): void {
    const parsedSource = ScraperSourceConfigSchema.parse(source) as ScraperConfig;
    this.sources.set(parsedSource.id, parsedSource);
  }

  /**
   * Retrieves a source by its UUID.
   */
  get(id: string): ScraperConfig | undefined {
    return this.sources.get(id);
  }

  /**
   * Retrieves all registered sources.
   */
  getAll(): ScraperConfig[] {
    return Array.from(this.sources.values());
  }

  /**
   * Retrieves all sources for a specific country code.
   */
  getByCountry(countryCode: string): ScraperConfig[] {
    return this.getAll().filter(source => source.country_code.toUpperCase() === countryCode.toUpperCase());
  }

  /**
   * Retrieves all sources of a specific source type.
   */
  getByType(sourceType: SourceType): ScraperConfig[] {
    return this.getAll().filter(source => source.source_type === sourceType);
  }
  
  /**
   * Load in bulk.
   */
  loadBulk(sources: ScraperConfig[]): void {
    sources.forEach(source => this.register(source));
  }
}

// Global singleton registry instance
export const globalSourceRegistry = new SourceRegistryImpl();

// Example of pre-populating with hardcoded seeds (would be pulled from DB in production)
globalSourceRegistry.register({
  id: 'c82f91d0-1234-4567-89ab-cdef01234567',
  country_code: 'DEU',
  source_name: 'BfArM Cannabis Agency',
  base_url: 'https://www.bfarm.de/EN/MedicalDevices/CannabisAgency/_node.html',
  source_type: 'regulatory',
  adapter_type: 'html_diff',
  cadence_hours: 12,
  is_active: true
});

globalSourceRegistry.register({
  id: 'c82f91d0-1234-4567-89ab-cdef01234568',
  country_code: 'CAN',
  source_name: 'Health Canada - Cannabis',
  base_url: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis.html',
  source_type: 'regulatory',
  adapter_type: 'html_diff',
  cadence_hours: 12,
  is_active: true
});
