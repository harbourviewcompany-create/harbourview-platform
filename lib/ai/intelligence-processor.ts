import { GoogleGenAI, Type, Schema } from '@google/genai';
import { IntelligenceRecord, SourceType, ImpactLevel } from '../scraper/types';
import crypto from 'node:crypto';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export class IntelligenceProcessor {
  /**
   * Processes raw scraped text using Gemini to extract structured intelligence.
   */
  async processContent(
    sourceId: string,
    countryCode: string,
    rawText: string
  ): Promise<IntelligenceRecord | null> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Skipping AI processing.');
      return null;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following raw scraped content from a ${countryCode} regulatory/trade source. Extract the key intelligence points related to cannabis or hemp regulations, trade, or market updates.\n\nContent:\n${rawText.slice(0, 100000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ExtractedIntelligenceSchema,
          temperature: 0.1,
        }
      });

      if (!response.text) {
          throw new Error("No response text from Gemini");
      }

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
        trade_route_information: parsed.trade_route_information || []
      };

    } catch (error) {
      console.error(`Failed to process intelligence for source ${sourceId}:`, error);
      return null;
    }
  }
}
