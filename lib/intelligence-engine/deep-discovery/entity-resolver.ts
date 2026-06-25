/**
 * Entity Resolution Engine
 *
 * Maps generic taxonomy roles (e.g. "National Medicines Agency") to the actual
 * real-world entity for a given country (e.g. "BfArM" in Germany, "ANVISA"
 * in Brazil) before crawling begins, so the crawler targets authoritative
 * primary sources rather than generic search results.
 *
 * Uses Claude (claude-haiku-4-5-20251001) for fast, high-quality structured
 * extraction. Previously used a HuggingFace Inference Endpoint which produced
 * poor JSON reliability and had no instruction-following for structured output.
 */

import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { SOURCE_TAXONOMY, ResolvedEntity } from './matrix';

const ResolvedAgencySchema = z.object({
  official_name_local:   z.string(),
  official_name_english: z.string(),
  primary_url:           z.string().url().nullable(),
  exact_search_terms:    z.array(z.string()),
  notes:                 z.string().optional(),
});

type ResolvedAgency = z.infer<typeof ResolvedAgencySchema>;

export class EntityResolver {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Resolves every taxonomy role for a given country into the specific
   * real-world agency/body responsible for that role.
   */
  async resolveTaxonomyForCountry(
    countryName: string,
    isoCode: string,
  ): Promise<ResolvedEntity[]> {
    console.log(`[EntityResolver] Resolving regulatory landscape for ${countryName} (${isoCode})...`);

    const results: ResolvedEntity[] = [];

    for (const [category, roles] of Object.entries(SOURCE_TAXONOMY)) {
      for (const role of roles) {
        const resolved = await this.resolveRole(countryName, isoCode, category, role);
        if (resolved) results.push(resolved);
      }
    }

    return results;
  }

  private async resolveRole(
    countryName: string,
    isoCode: string,
    category: string,
    role: string,
  ): Promise<ResolvedEntity | null> {
    const prompt = `You are a regulatory intelligence researcher. Identify the exact official organization in ${countryName} responsible for: "${role}".

If no such organization exists (e.g. the country has no cannabis framework yet), return null for primary_url and note this.

Respond with ONLY a JSON object matching this exact schema — no markdown, no explanation:
{
  "official_name_local": "Name in local language or script",
  "official_name_english": "Name in English",
  "primary_url": "Official website URL (string) or null",
  "exact_search_terms": ["specific", "search", "keywords", "for", "crawler"],
  "notes": "Any important caveat about this organization (optional)"
}`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = ResolvedAgencySchema.safeParse(JSON.parse(jsonMatch[0]));
      if (!parsed.success) return null;

      const agency: ResolvedAgency = parsed.data;
      return {
        country_code:          isoCode,
        category,
        role,
        official_name_local:   agency.official_name_local,
        official_name_english: agency.official_name_english,
        primary_url:           agency.primary_url,
        confidence:            0.9,
      };
    } catch (err) {
      console.error(`[EntityResolver] Failed to resolve "${role}" in ${countryName}:`, err);
      return null;
    }
  }
}
