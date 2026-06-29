/**
 * HuggingFace Extractor Adapter (tools/intelligence-engine-studio)
 * Plugs into the HuggingFace Inference Endpoints established in Harbourview's
 * `lib/hf/` directory to convert unstructured HTML/Text into standardized DTOs.
 *
 * Token resolution: HF_TOKEN_SERVER only — the single canonical server-side
 * HF token. Do not read HF_TOKEN; it is a deprecated alias being removed.
 *
 * Endpoint: HF_ENDPOINT_EXTRACT_QWEN3_4B (production endpoint).
 * Falls back to the free serverless Qwen2.5-7B API for dev/CI when the
 * provisioned endpoint is not configured.
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
    // Canonical token: HF_TOKEN_SERVER. Canonical endpoint: HF_ENDPOINT_EXTRACT_QWEN3_4B.
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

      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const parsedJson: unknown = JSON.parse(jsonMatch ? jsonMatch[0] : generatedText);

      const validSignal = SignalDTOSchema.parse(parsedJson);
      return validSignal;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[HF] Extraction failed for target_id ${result.target_id}:`, message);
      return null;
    }
  }
}
