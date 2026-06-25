/**
 * HuggingFace Extractor Adapter
 * Plugs into the HuggingFace Inference Endpoints established in Harbourview's
 * `lib/hf/` directory to convert unstructured HTML/Text into standardized DTOs.
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
  industrial_impact: z.boolean().optional()
});

export type SignalDTO = z.infer<typeof SignalDTOSchema>;

export class HuggingFaceExtractor {
  private endpoint: string;
  private token: string;

  constructor() {
    this.endpoint = process.env.HF_INFERENCE_ENDPOINT || 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct';
    this.token = process.env.HF_TOKEN || process.env.HF_TOKEN_SERVER || '';
  }

  async extractSignal(result: ScraperResult, countryCode: string): Promise<SignalDTO | null> {
    if (!this.endpoint || !this.token) {
      console.warn('[HF] Skipping extraction - API keys missing.');
      return null;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Extract cannabis market intelligence from the following text. Respond strictly in JSON matching the SignalDTO structure. Country context: ${countryCode}.\n\nText: ${result.raw_content.slice(0, 4000)}`,
          parameters: {
            max_new_tokens: 1024,
            return_full_text: false,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HF API HTTP ${response.status}`);
      }

      const responseBody = await response.json();
      const generatedText = responseBody[0]?.generated_text || '{}';
      
      // Attempt to parse JSON from the model
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const parsedJson = JSON.parse(jsonMatch ? jsonMatch[0] : generatedText);

      // Validate against our rigorous Zod schema
      const validSignal = SignalDTOSchema.parse(parsedJson);
      return validSignal;

    } catch (err: any) {
      console.error(`[HF] Extraction failed for target_id ${result.target_id}:`, err.message);
      return null;
    }
  }
}
