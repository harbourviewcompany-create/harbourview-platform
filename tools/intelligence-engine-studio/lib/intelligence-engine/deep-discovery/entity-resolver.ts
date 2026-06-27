/**
 * Entity Resolution Engine
 * 
 * Instead of blind keyword searches, this engine uses AI to map the taxonomy
 * (e.g., "National Medicines Agency") to the actual real-world entity 
 * (e.g., "BfArM" in Germany or "ANVISA" in Brazil) before we start crawling.
 */

import { z } from 'zod';
import { SOURCE_TAXONOMY, ResolvedEntity } from './matrix';

const ResolvedAgencySchema = z.object({
  official_name_local: z.string(),
  official_name_english: z.string(),
  primary_url: z.string().url().nullable(),
  exact_search_terms: z.array(z.string()),
  notes: z.string().optional()
});

export class EntityResolver {
  private hfEndpoint: string;
  private hfToken: string;

  constructor() {
    this.hfEndpoint = process.env.HF_INFERENCE_ENDPOINT || 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct';
    this.hfToken = process.env.HF_TOKEN || process.env.HF_TOKEN_SERVER || '';
  }

  /**
   * Resolves generic taxonomy roles into specific government/commercial entities for a given country.
   */
  async resolveTaxonomyForCountry(countryName: string, isoCode: string): Promise<ResolvedEntity[]> {
    console.log(`[Entity Resolver] Resolving regulatory landscape for ${countryName} (${isoCode})...`);
    
    const results: ResolvedEntity[] = [];

    // We iterate through the top level categories
    for (const [category, roles] of Object.entries(SOURCE_TAXONOMY)) {
      for (const role of roles) {
        // In a real run, batch these or use a larger context window model.
        // For HarbourView's Inference Endpoint:
        const prompt = `Identify the exact official organization in ${countryName} responsible for: "${role}".
        Respond in strict JSON matching this schema:
        {
          "official_name_local": "Name in local language",
          "official_name_english": "Name in English",
          "primary_url": "Official website URL (or null)",
          "exact_search_terms": ["highly", "specific", "keywords", "for", "crawlers"]
        }`;

        try {
          const response = await this.askAI(prompt);
          if (response) {
            results.push({
              country_code: isoCode,
              category,
              role,
              official_name_local: response.official_name_local,
              official_name_english: response.official_name_english,
              primary_url: response.primary_url,
              confidence: 0.9 // Placeholder based on model output
            });
          }
        } catch (err) {
          console.error(`Failed to resolve ${role} in ${countryName}`);
        }
      }
    }

    return results;
  }

  private async askAI(prompt: string): Promise<z.infer<typeof ResolvedAgencySchema> | null> {
    if (!this.hfEndpoint || !this.hfToken) return null;

    try {
      const res = await fetch(this.hfEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 512, return_full_text: false }
        })
      });
      
      const responseBody = await res.json();
      const generatedText = responseBody[0]?.generated_text || '{}';
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      return ResolvedAgencySchema.parse(JSON.parse(jsonMatch ? jsonMatch[0] : '{}'));
    } catch {
      return null;
    }
  }
}
