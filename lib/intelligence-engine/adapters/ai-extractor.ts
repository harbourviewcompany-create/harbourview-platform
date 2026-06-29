/**
 * HuggingFace Extractor Adapter
 * Plugs into the HuggingFace Inference Endpoints established in Harbourview's
 * `lib/hf/` directory to convert unstructured HTML/Text into standardized DTOs.
 *
 * Token resolution order (single canonical source):
 *   HF_TOKEN_SERVER — the only authorized server-side HF token variable.
 *   See lib/hf/env.ts for the full schema and lib/hf/client.ts for the
 *   singleton client. Do not read HF_TOKEN directly — it is an undocumented
 *   alias that is being phased out.
 *
 * Endpoint resolution order:
 *   HF_ENDPOINT_EXTRACT_QWEN3_4B (preferred — provisioned endpoint)
 *   → falls back to free serverless inference API for local dev/CI
 */

import { z } from 'zod';
import { ScraperResult } from '../types';

export const SignalDTOSchema = z.object({
  title: z.string(),
  summary: z.string(),
  signal_type: z.enum(['Regulatory', 'Market', 'Trade', 'Watchlist']),
  impact_level: z.enum(['Low', 'Medium', 'High', 'Critical']),
  entities: z.array(z.string()),
  country_code: z.string().length(3),
  // Additional deep data points
  medical_impact: z.boolean().optional(),
  adult_use_impact: z.boolean().optional(),
  industrial_impact: z.boolean().optional(),
});

export type SignalDTO = z.infer<typeof SignalDTOSchema>;

const FREE_INFERENCE_FALLBACK =
  'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct';

export class HuggingFaceExtractor {
  private endpoint: string;
  private token: string;

  constructor() {
    // Use the canonical HF_TOKEN_SERVER variable. HF_ENDPOINT_EXTRACT_QWEN3_4B
    // is the production endpoint; fall back to the free serverless API in dev/CI.
    this.endpoint =
      process.env.HF_ENDPOINT_EXTRACT_QWEN3_4B ?? FREE_INFERENCE_FALLBACK;
    this.token = process.env.HF_TOKEN_SERVER ?? '';
  }

  async extractSignal(result: ScraperResult, countryCode: string): Promise<SignalDTO | null> {
    if (!this.token) {
      console.warn(
        '[HF] Skipping extraction — HF_TOKEN_SERVER is not set. ' +
        'Add it to your .env.local or Vercel environment variables.',
      );
      return null;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs:
            `Extract cannabis market intelligence from the following text. ` +
            `Respond strictly in JSON matching the SignalDTO structure. ` +
            `Country context: ${countryCode}.\n\nText: ${result.raw_content.slice(0, 4000)}`,
          parameters: {
            max_new_tokens: 1024,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HF API HTTP ${response.status}`);
      }

      const responseBody = await response.json() as Array<{ generated_text?: string }>;
      const generatedText = responseBody[0]?.generated_text ?? '{}';

      // Attempt to parse JSON from the model output
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const parsedJson: unknown = JSON.parse(jsonMatch ? jsonMatch[0] : generatedText);

      // Validate against Zod schema before returning
      const validSignal = SignalDTOSchema.parse(parsedJson);
      return validSignal;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[HF] Extraction failed for target_id ${result.target_id}:`, message);
      return null;
    }
  }
}
