import 'server-only'

import { executeLlmGateway } from '@/lib/llm/gateway'
import { LlmGatewayError } from '@/lib/llm/types'
import { getLatestBriefing, type JurisdictionBriefing as SynthBriefing } from '@/lib/intelligence/jurisdictionSynthesis'

export type PersonalBriefingInput = {
  keywords: string[]
  iso2List: string[]
  ruleTypes: string[]
}

export type PersonalBriefingResult = {
  narrative: string
  marketsCovered: string[]
  source: 'llm' | 'fallback'
}

type MarketContext = {
  iso2: string
  briefing: (SynthBriefing & { week_ending: string; signal_count: number }) | null
}

async function loadMarketContexts(iso2List: string[]): Promise<MarketContext[]> {
  const unique = Array.from(new Set(iso2List.map((c) => c.toUpperCase()))).slice(0, 6)
  const rows = await Promise.all(
    unique.map(async (iso2) => ({
      iso2,
      briefing: await getLatestBriefing(iso2),
    })),
  )
  return rows
}

function buildFallback(input: PersonalBriefingInput, contexts: MarketContext[]): PersonalBriefingResult {
  const withBriefings = contexts.filter((c) => c.briefing)
  if (withBriefings.length === 0) {
    const kw = input.keywords.slice(0, 5).join(', ') || 'your watch themes'
    return {
      narrative: `No published weekly synthesis is available yet for the markets on your watchlist. Keep ${kw} rules active — when reviewed signals land, Harbourview will assemble a personal briefing here.`,
      marketsCovered: input.iso2List,
      source: 'fallback',
    }
  }

  const lines = withBriefings.map((c) => {
    const b = c.briefing!
    return `${c.iso2}: ${b.headline}`
  })
  return {
    narrative: `Latest published weekly briefings for your watched markets — ${lines.join(' · ')}. Open each market card below for operator implications and key signals.`,
    marketsCovered: withBriefings.map((c) => c.iso2),
    source: 'fallback',
  }
}

function buildPrompt(input: PersonalBriefingInput, contexts: MarketContext[]): string {
  const briefBlocks = contexts
    .filter((c) => c.briefing)
    .map((c) => {
      const b = c.briefing!
      return [
        `Market ${c.iso2} (week ending ${b.week_ending}, ${b.signal_count} signals):`,
        `  Headline: ${b.headline}`,
        `  Summary: ${b.summary}`,
        b.what_changed ? `  What changed: ${b.what_changed}` : null,
        b.operator_implications ? `  Operator implications: ${b.operator_implications}` : null,
        b.whats_coming ? `  What's coming: ${b.whats_coming}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')

  const keywords = input.keywords.slice(0, 16).join(', ') || '(none)'
  const ruleTypes = input.ruleTypes.slice(0, 8).join(', ') || '(none)'
  const markets = input.iso2List.slice(0, 8).join(', ') || '(none specified)'

  return `You are writing a personalized intelligence briefing for a Harbourview user (licensed cannabis operator, importer/exporter, or investor).

Their active watch focus:
- Keywords: ${keywords}
- Rule types: ${ruleTypes}
- Watched markets (ISO2): ${markets}

Published weekly jurisdiction briefings available:
${briefBlocks || 'No weekly LLM briefings available for these markets yet.'}

Write a single short briefing paragraph (3–5 sentences, plain prose, no markdown, no greeting/sign-off) that:
1. Highlights the most commercially relevant development across their watched markets.
2. Ties implications to their keyword/rule focus where evidence supports it.
3. Stays factual — do not invent regulations or counterparties not present in the source briefings.
4. If source briefings are sparse, say so plainly and note what to watch next.

Write only the paragraph, nothing else.`
}

/**
 * On-demand personalized briefing for My Briefings.
 * Prefer LLM synthesis when gateway is enabled; fall back to deterministic
 * headline assembly so the page never fails closed on LLM outage.
 */
export async function generatePersonalBriefing(
  input: PersonalBriefingInput,
): Promise<PersonalBriefingResult> {
  const contexts = await loadMarketContexts(input.iso2List)

  if (input.keywords.length === 0 && input.iso2List.length === 0) {
    return {
      narrative:
        'Add active watch rules (keywords or jurisdiction ISO2 codes) in the Command Centre to drive a personalized briefing here.',
      marketsCovered: [],
      source: 'fallback',
    }
  }

  const hasAnyBriefing = contexts.some((c) => c.briefing)
  if (!hasAnyBriefing && input.iso2List.length === 0) {
    return buildFallback(input, contexts)
  }

  try {
    const result = await executeLlmGateway({
      provider: 'anthropic',
      messages: [{ role: 'user', content: buildPrompt(input, contexts) }],
      temperature: 0.3,
      maxOutputTokens: 320,
    })
    const text = (result.text ?? '').trim()
    if (!text) return buildFallback(input, contexts)
    return {
      narrative: text,
      marketsCovered: contexts.filter((c) => c.briefing).map((c) => c.iso2),
      source: 'llm',
    }
  } catch (error) {
    if (error instanceof LlmGatewayError) {
      console.info(`personalBriefing: skipped (${error.code})`)
    } else {
      console.warn(
        'personalBriefing: unexpected error',
        error instanceof Error ? error.message : error,
      )
    }
    return buildFallback(input, contexts)
  }
}

/** Fetch published weekly LLM briefings for a set of ISO2 codes. */
export async function getSynthBriefingsForMarkets(iso2List: string[]) {
  const unique = Array.from(new Set(iso2List.map((c) => c.toUpperCase()))).slice(0, 8)
  const rows = await Promise.all(
    unique.map(async (iso2) => {
      const briefing = await getLatestBriefing(iso2)
      return briefing ? { iso2, briefing } : null
    }),
  )
  return rows.filter((r): r is NonNullable<typeof r> => r !== null)
}
