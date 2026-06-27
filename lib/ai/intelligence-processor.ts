import { GoogleGenAI, Type, Schema } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { IntelligenceRecord, SourceType, ImpactLevel } from '../scraper/types';
import crypto from 'node:crypto';

const ExtractedIntelligenceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'A clear, concise title for the intelligence update.' },
    summary: { type: Type.STRING, description: 'A detailed summary of the regulatory or trade changes.' },
    signal_type: {
      type: Type.STRING,
      enum: ['regulatory', 'trade', 'market', 'scientific', 'other', 'Watchlist'],
      description: 'The category of the intelligence signal.'
    },
    impact_level: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      description: 'The assessed impact level on the cannabis industry.'
    },
    entities_mentioned: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific organizations, government bodies, or companies mentioned.'
    },
    medical_impact: { type: Type.BOOLEAN, description: 'Does this affect the medical cannabis sector?' },
    adult_use_impact: { type: Type.BOOLEAN, description: 'Does this affect the adult-use/recreational cannabis sector?' },
    industrial_impact: { type: Type.BOOLEAN, description: 'Does this affect the industrial hemp sector?' },
    regulatory_changes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific regulatory framework changes or legal adjustments found in the text.'
    },
    licensing_updates: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Information regarding licensing quotas, new licenses, or application processes.'
    },
    trade_route_information: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Information regarding imports, exports, compliance checks at borders, or routing.'
    }
  },
  required: ['title', 'summary', 'signal_type', 'impact_level', 'entities_mentioned']
};

const CLAUDE_EXTRACTION_PROMPT = (countryCode: string, rawText: string) =>
  `You are a regulatory intelligence analyst for the global cannabis industry. Analyze this content from a ${countryCode} regulatory/trade source and extract key intelligence signals related to cannabis or hemp regulations, trade, or market developments.

Respond with ONLY a JSON object — no markdown, no explanation:
{
  "title": "Clear concise title for this intelligence update",
  "summary": "Detailed summary of the regulatory or trade changes",
  "signal_type": "regulatory" | "trade" | "market" | "scientific" | "other",
  "impact_level": "Low" | "Medium" | "High" | "Critical",
  "entities_mentioned": ["Organization or body names mentioned"],
  "medical_impact": true | false,
  "adult_use_impact": true | false,
  "industrial_impact": true | false,
  "regulatory_changes": ["Specific regulatory changes found"],
  "licensing_updates": ["Licensing quota or process updates"],
  "trade_route_information": ["Import/export/border compliance info"]
}

Content:
${rawText.slice(0, 50_000)}`;

export class IntelligenceProcessor {
  private anthropic: Anthropic | null;

  constructor() {
    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
  }

  /**
   * Processes raw scraped text using Gemini (primary) or Claude Haiku (fallback).
   */
  async processContent(
    sourceId: string,
    countryCode: string,
    rawText: string
  ): Promise<IntelligenceRecord | null> {
    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasClaude = !!this.anthropic;

    if (!hasGemini && !hasClaude) {
      console.warn('intelligence-processor: neither GEMINI_API_KEY nor ANTHROPIC_API_KEY set — skipping');
      return null;
    }

    if (hasGemini) {
      const result = await this.processWithGemini(sourceId, countryCode, rawText);
      if (result) return result;
      if (!hasClaude) return null;
      console.warn(`intelligence-processor: Gemini failed for ${sourceId} — trying Claude Haiku fallback`);
    }

    return this.processWithClaude(sourceId, countryCode, rawText);
  }

  private async processWithGemini(
    sourceId: string,
    countryCode: string,
    rawText: string,
  ): Promise<IntelligenceRecord | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following raw scraped content from a ${countryCode} regulatory/trade source. Extract the key intelligence points related to cannabis or hemp regulations, trade, or market updates.\n\nContent:\n${rawText.slice(0, 100_000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ExtractedIntelligenceSchema,
          temperature: 0.1,
        }
      });

      if (!response.text) return null;

      const parsed = JSON.parse(response.text);
      const contentHash = crypto.createHash('sha256').update(rawText).digest('hex');

      return {
        id: crypto.randomUUID(),
        source_id: sourceId,
        country_code: countryCode,
        timestamp: new Date().toISOString(),
        title: parsed.title,
        summary: parsed.summary,
        signal_type: parsed.signal_type as SourceType | 'Watchlist',
        impact_level: parsed.impact_level as ImpactLevel,
        entities_mentioned: parsed.entities_mentioned || [],
        raw_content_reference: contentHash,
        medical_impact: parsed.medical_impact,
        adult_use_impact: parsed.adult_use_impact,
        industrial_impact: parsed.industrial_impact,
        regulatory_changes: parsed.regulatory_changes || [],
        licensing_updates: parsed.licensing_updates || [],
        trade_route_information: parsed.trade_route_information || [],
      };
    } catch (error) {
      console.error(`intelligence-processor: Gemini error for ${sourceId}:`, error);
      return null;
    }
  }

  private async processWithClaude(
    sourceId: string,
    countryCode: string,
    rawText: string,
  ): Promise<IntelligenceRecord | null> {
    if (!this.anthropic) return null;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: CLAUDE_EXTRACTION_PROMPT(countryCode, rawText) }],
      });

      const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.title || !parsed.summary) return null;

      const contentHash = crypto.createHash('sha256').update(rawText).digest('hex');

      return {
        id: crypto.randomUUID(),
        source_id: sourceId,
        country_code: countryCode,
        timestamp: new Date().toISOString(),
        title: String(parsed.title),
        summary: String(parsed.summary),
        signal_type: (parsed.signal_type as SourceType) || 'other',
        impact_level: (parsed.impact_level as ImpactLevel) || 'Medium',
        entities_mentioned: Array.isArray(parsed.entities_mentioned) ? parsed.entities_mentioned : [],
        raw_content_reference: contentHash,
        medical_impact: Boolean(parsed.medical_impact),
        adult_use_impact: Boolean(parsed.adult_use_impact),
        industrial_impact: Boolean(parsed.industrial_impact),
        regulatory_changes: Array.isArray(parsed.regulatory_changes) ? parsed.regulatory_changes : [],
        licensing_updates: Array.isArray(parsed.licensing_updates) ? parsed.licensing_updates : [],
        trade_route_information: Array.isArray(parsed.trade_route_information) ? parsed.trade_route_information : [],
      };
    } catch (error) {
      console.error(`intelligence-processor: Claude fallback error for ${sourceId}:`, error);
      return null;
    }
  }
}
