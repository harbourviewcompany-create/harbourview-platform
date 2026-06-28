import { GoogleGenAI, Type, Schema } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { IntelligenceRecord, SourceType, ImpactLevel } from '../scraper/types';
import crypto from 'node:crypto';

const ExtractedIntelligenceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_relevant: {
      type: Type.BOOLEAN,
      description: 'TRUE only if the content contains genuine commercial cannabis/hemp intelligence: regulatory changes, licensing updates, market access news, trade flows, or policy decisions. FALSE for product listings, clinical trial protocols, academic abstracts, retail menus, general news, or any content without direct commercial operator impact.'
    },
    irrelevance_reason: {
      type: Type.STRING,
      description: 'If is_relevant is false, brief reason (e.g. "retail product listing", "clinical trial protocol", "no cannabis content detected").'
    },
    title: { type: Type.STRING, description: 'A clear, concise title for the intelligence update. Must describe a specific regulatory, trade, or market development.' },
    summary: { type: Type.STRING, description: 'A detailed summary of the regulatory or trade changes and their commercial impact for licensed cannabis operators.' },
    signal_type: {
      type: Type.STRING,
      enum: ['regulatory', 'trade', 'market', 'scientific', 'other', 'Watchlist'],
      description: 'The category of the intelligence signal.'
    },
    impact_level: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      description: 'The assessed impact level on licensed cannabis operators seeking market access.'
    },
    entities_mentioned: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific government bodies, regulatory agencies, or named companies mentioned.'
    },
    medical_impact: { type: Type.BOOLEAN, description: 'Does this affect the medical cannabis sector?' },
    adult_use_impact: { type: Type.BOOLEAN, description: 'Does this affect the adult-use/recreational cannabis sector?' },
    industrial_impact: { type: Type.BOOLEAN, description: 'Does this affect the industrial hemp sector?' },
    regulatory_changes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific regulatory framework changes or legal adjustments. Empty array if none found.'
    },
    licensing_updates: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Information regarding licensing quotas, new licenses, or application processes. Empty array if none found.'
    },
    trade_route_information: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Information regarding imports, exports, or compliance at borders. Empty array if none found.'
    }
  },
  required: ['is_relevant', 'title', 'summary', 'signal_type', 'impact_level', 'entities_mentioned',
             'regulatory_changes', 'licensing_updates', 'trade_route_information']
};

// Minimum signal quality: must have at least one of these populated to be worth storing
function hasSubstantiveContent(parsed: {
  regulatory_changes: string[];
  licensing_updates: string[];
  trade_route_information: string[];
  entities_mentioned: string[];
  signal_type: string;
  impact_level: string;
}): boolean {
  const hasChanges =
    (parsed.regulatory_changes?.length ?? 0) > 0 ||
    (parsed.licensing_updates?.length ?? 0) > 0 ||
    (parsed.trade_route_information?.length ?? 0) > 0;
  const notLowOther =
    !(parsed.signal_type === 'other' && parsed.impact_level === 'Low');
  const hasEntities = (parsed.entities_mentioned?.length ?? 0) > 0;
  return hasChanges || (notLowOther && hasEntities);
}

const CLAUDE_EXTRACTION_PROMPT = (countryCode: string, rawText: string) =>
  `You are a regulatory intelligence analyst for the global cannabis industry. Analyze this content from a ${countryCode} source.

FIRST determine if this is genuine commercial cannabis intelligence — regulatory changes, licensing updates, market access news, trade flows, import/export rules, or government policy decisions affecting licensed cannabis operators.

NOT relevant: retail product menus, clinical trial protocols, academic pharmacokinetics studies, dispensary listings, general health news, raw API JSON with no policy content.

If NOT relevant, respond with {"is_relevant": false, "irrelevance_reason": "...", "title": "", "summary": "", "signal_type": "other", "impact_level": "Low", "entities_mentioned": [], "medical_impact": false, "adult_use_impact": false, "industrial_impact": false, "regulatory_changes": [], "licensing_updates": [], "trade_route_information": []}

If IS relevant, extract:
{
  "is_relevant": true,
  "title": "Specific headline describing the regulatory/market development",
  "summary": "Detailed summary of what changed and its commercial impact for licensed operators",
  "signal_type": "regulatory" | "trade" | "market" | "scientific" | "other",
  "impact_level": "Low" | "Medium" | "High" | "Critical",
  "entities_mentioned": ["Government bodies, agencies, named companies"],
  "medical_impact": true | false,
  "adult_use_impact": true | false,
  "industrial_impact": true | false,
  "regulatory_changes": ["Specific changes found"],
  "licensing_updates": ["Licensing quota or process updates"],
  "trade_route_information": ["Import/export/border info"]
}

Content:
${rawText.slice(0, 50_000)}`;

// Quick pre-filter: reject content that is clearly not cannabis policy intelligence
// without spending API tokens on it. Runs before LLM call.
function quickRelevanceCheck(text: string): { pass: boolean; reason?: string } {
  const lower = text.toLowerCase();

  // Must have some cannabis/hemp signal
  const cannabisTerms = ['cannabis', 'cannabinoid', 'thc', 'cbd', 'hemp', 'marijuana',
    'marihuana', 'chanvre', 'cannabis médicinal', 'cannabidiol', 'phytocannabinoid'];
  const hasCannabisTerm = cannabisTerms.some(t => lower.includes(t));
  if (!hasCannabisTerm) return { pass: false, reason: 'no cannabis terms detected' };

  // Reject obvious noise patterns
  const noisePatterns = [
    // ClinicalTrials.gov JSON
    /eligibilitycriteria.*inclusion criteria/i,
    /"studytype"\s*:\s*"interventional"/i,
    /"phases"\s*:\s*\["phase/i,
    /pharmacokinetics.*\{.*timeframe/i,
    // Retail product listings
    /view all.*vape cartridges.*view all.*extracts/i,
    /\$\d+\.\d+.*hybrid.*indica.*sativa/i,
    /add to cart.*thc.*mg\/pc/i,
    // Raw API JSON blobs
    /^\s*\{[\s\S]*"eligibilitymodule"/i,
    /conditionsmodule[\s\S]*designmodule[\s\S]*interventionsmodule/i,
  ];

  for (const pattern of noisePatterns) {
    if (pattern.test(text)) return { pass: false, reason: 'matched noise pattern' };
  }

  // Reject if it looks like a clinical trial or academic abstract without policy content
  const policyTerms = ['regulat', 'licens', 'legislat', 'law', 'act ', 'bill ', 'policy',
    'ministry', 'minister', 'government', 'import', 'export', 'permit', 'authoriz',
    'approv', 'compli', 'framework', 'directive', 'ordinance', 'decree', 'annex'];
  const hasPolicyTerm = policyTerms.some(t => lower.includes(t));
  if (!hasPolicyTerm && lower.includes('pharmacokinetics')) {
    return { pass: false, reason: 'clinical/scientific without policy context' };
  }

  return { pass: true };
}

export class IntelligenceProcessor {
  private anthropic: Anthropic | null;

  constructor() {
    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
  }

  /**
   * Processes raw scraped text using Gemini (primary) or Claude Haiku (fallback).
   * Returns null if content is not relevant commercial cannabis intelligence.
   */
  async processContent(
    sourceId: string,
    countryCode: string,
    rawText: string
  ): Promise<IntelligenceRecord | null> {
    // Pre-filter before spending API tokens
    const preCheck = quickRelevanceCheck(rawText);
    if (!preCheck.pass) {
      console.info(`intelligence-processor: pre-filter rejected ${sourceId} (${preCheck.reason})`);
      return null;
    }

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
        contents: `You are a regulatory intelligence analyst for the global cannabis industry. Analyze this content from a ${countryCode} source.\n\nFirst determine: is this genuine commercial cannabis intelligence? (regulatory changes, licensing, market access, trade flows, government policy) — NOT retail listings, clinical trial protocols, or pharmacokinetics studies.\n\nIf not relevant, set is_relevant=false. If relevant, extract full intelligence.\n\nContent:\n${rawText.slice(0, 100_000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ExtractedIntelligenceSchema,
          temperature: 0.1,
        }
      });

      if (!response.text) return null;

      const parsed = JSON.parse(response.text);

      // Relevance gate: reject if LLM determined content is not relevant
      if (!parsed.is_relevant) {
        console.info(`intelligence-processor: Gemini rejected ${sourceId} as irrelevant (${parsed.irrelevance_reason ?? 'no reason given'})`);
        return null;
      }

      // Quality gate: must have substantive extracted content
      if (!hasSubstantiveContent(parsed)) {
        console.info(`intelligence-processor: Gemini extraction for ${sourceId} lacked substantive content — discarding`);
        return null;
      }

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

      // Relevance gate
      if (parsed.is_relevant === false) {
        console.info(`intelligence-processor: Claude rejected ${sourceId} as irrelevant (${parsed.irrelevance_reason ?? 'no reason'})`);
        return null;
      }

      if (!parsed.title || !parsed.summary) return null;

      // Quality gate
      if (!hasSubstantiveContent(parsed)) {
        console.info(`intelligence-processor: Claude extraction for ${sourceId} lacked substantive content — discarding`);
        return null;
      }

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
