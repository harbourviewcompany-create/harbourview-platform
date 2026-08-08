import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import {
  SIGNAL_QUALITY_SELECT,
  QUALITY_LABEL_NOT_IN,
  resolveConfidence,
  type SignalQualityRow,
} from '@/lib/signals/quality'

const SYNTH_SELECT = `headline, country, date, top_lane, cat, commercial_impact, pri, reviewed, ${SIGNAL_QUALITY_SELECT}` as const

// ── Active markets to synthesise weekly ──────────────────────────────────────
export const SYNTHESIS_MARKETS: { iso2: string; name: string }[] = [
  { iso2: 'DE', name: 'Germany' },
  { iso2: 'GB', name: 'United Kingdom' },
  { iso2: 'AU', name: 'Australia' },
  { iso2: 'CA', name: 'Canada' },
  { iso2: 'NL', name: 'Netherlands' },
  { iso2: 'PT', name: 'Portugal' },
  { iso2: 'TH', name: 'Thailand' },
  { iso2: 'IL', name: 'Israel' },
  { iso2: 'CO', name: 'Colombia' },
  { iso2: 'ZA', name: 'South Africa' },
  { iso2: 'MT', name: 'Malta' },
  { iso2: 'LU', name: 'Luxembourg' },
  { iso2: 'CZ', name: 'Czechia' },
  { iso2: 'NZ', name: 'New Zealand' },
  { iso2: 'MX', name: 'Mexico' },
  { iso2: 'BR', name: 'Brazil' },
  { iso2: 'CH', name: 'Switzerland' },
  { iso2: 'FR', name: 'France' },
  { iso2: 'ES', name: 'Spain' },
  { iso2: 'PL', name: 'Poland' },
]

export type JurisdictionBriefing = {
  headline: string
  legal_status: string
  market_maturity: string
  summary: string
  what_changed: string | null
  operator_implications: string | null
  whats_coming: string | null
  key_signals: string[]
}

type SignalRow = {
  headline: string
  country: string | null
  date: string | null
  quality_confidence: number | string | null
  quality_label?: string | null
  reviewed?: boolean | null
  top_lane: string | null
  cat: string | null
  commercial_impact: string | null
  pri: string | null
}

// ── Fetch signals for a country from the last 30 days ────────────────────────
async function fetchSignalsForCountry(
  svcUrl: string,
  svcKey: string,
  countryName: string,
): Promise<SignalRow[]> {
  const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Primary: curated signals table, last 30 days
  const { data: primary } = await svc
    .from('signals_with_quality')
    .select(SYNTH_SELECT)
    .eq('reviewed', true)
    .gte('date', cutoff)
    .ilike('country', countryName)
    .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
    .order('quality_confidence', { ascending: false, nullsFirst: false })
    .limit(30)

  if (primary && primary.length >= 3) return primary as SignalRow[]

  // Fallback: any reviewed signals for this country regardless of date
  const { data: fallback } = await svc
    .from('signals_with_quality')
    .select(SYNTH_SELECT)
    .eq('reviewed', true)
    .ilike('country', countryName)
    .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
    .order('quality_confidence', { ascending: false, nullsFirst: false })
    .limit(20)

  return (fallback ?? []) as SignalRow[]
}

// ── Format signals for the prompt ────────────────────────────────────────────
function formatSignalsForPrompt(signals: SignalRow[]): string {
  if (signals.length === 0) return 'No recent signals available for this jurisdiction.'
  return signals
    .map((s, i) => {
      // Feed the validated classifier confidence, not the legacy inverted
      // keyword score — the old value actively misinformed the synthesis.
      const conf   = resolveConfidence(s as SignalQualityRow)
      const score  = conf !== null ? ` [confidence: ${conf}]` : ''
      const lane   = s.top_lane ? ` | lane: ${s.top_lane}` : ''
      const impact = s.commercial_impact ? `\n   Impact: ${s.commercial_impact}` : ''
      return `${i + 1}. ${s.headline}${score}${lane}${impact}`
    })
    .join('\n\n')
}

const PROMPT_VERSION = 1

function buildPrompt(countryName: string, signalText: string): string {
  return `You are an expert analyst at Harbourview, the global cannabis industry intelligence platform.
Your task: synthesise a weekly intelligence briefing for ${countryName} based on recent signals below.

Audience: licensed cannabis operators, importers/exporters, compliance professionals, clinicians, and investors.

RECENT SIGNALS FOR ${countryName.toUpperCase()}:
${signalText}

Produce a JSON object with EXACTLY these fields — no extra fields, no markdown fences:
{
  "headline": "One specific, compelling sentence summarising the single most important development. Include the country name.",
  "legal_status": "EXACTLY one of: medical_only | adult_use | decrim | illegal | mixed | transitional | unknown",
  "market_maturity": "EXACTLY one of: emerging | developing | maturing | mature | restricted | unknown",
  "summary": "2–3 sentences. Current legal and commercial state, who is most active, what's happening right now.",
  "what_changed": "1–2 sentences on the most significant changes in the past 30 days. Use null if no meaningful changes.",
  "operator_implications": "2–3 sentences: what licensed operators, importers, exporters, or clinicians should know or act on right now.",
  "whats_coming": "1–2 sentences on expected regulatory or market developments in the next 30–90 days. Use null if insufficient signal data.",
  "key_signals": ["array of 3–5 exact signal headlines from the list above, verbatim"]
}

Rules:
- Be specific and factual. Never invent regulatory details not evidenced in the signals.
- If signals are sparse, acknowledge it plainly in the summary rather than filling gaps with speculation.
- key_signals must be exact strings from the numbered list — do not paraphrase.
- legal_status and market_maturity must be exactly one of the enum values listed.
- Respond with valid JSON only. No commentary, no markdown.`
}

// ── Call Claude and parse the response ───────────────────────────────────────
async function synthesiseWithClaude(
  prompt: string,
): Promise<JurisdictionBriefing | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('jurisdiction_synthesis: ANTHROPIC_API_KEY not configured')
    return null
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  // Strip any accidental markdown fences
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    const parsed = JSON.parse(clean)
    // Validate required fields
    if (typeof parsed.headline !== 'string' || typeof parsed.summary !== 'string') return null
    return {
      headline:              String(parsed.headline ?? '').trim(),
      legal_status:          String(parsed.legal_status ?? 'unknown').trim(),
      market_maturity:       String(parsed.market_maturity ?? 'unknown').trim(),
      summary:               String(parsed.summary ?? '').trim(),
      what_changed:          parsed.what_changed ? String(parsed.what_changed).trim() : null,
      operator_implications: parsed.operator_implications ? String(parsed.operator_implications).trim() : null,
      whats_coming:          parsed.whats_coming ? String(parsed.whats_coming).trim() : null,
      key_signals:           Array.isArray(parsed.key_signals) ? parsed.key_signals.map(String) : [],
    }
  } catch (e) {
    console.error('jurisdiction_synthesis: JSON parse error', e, 'raw:', clean.slice(0, 200))
    return null
  }
}

// ── Public: synthesise one country and upsert ────────────────────────────────
export async function synthesiseJurisdiction(
  countryIso2: string,
  countryName: string,
): Promise<{ ok: true; briefing: JurisdictionBriefing; signal_count: number } | { ok: false; error: string }> {
  const svcUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!svcUrl || !svcKey) return { ok: false, error: 'Supabase env vars missing' }

  const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const signals = await fetchSignalsForCountry(svcUrl, svcKey, countryName)
  const signalText = formatSignalsForPrompt(signals)

  const prompt   = buildPrompt(countryName, signalText)
  const briefing = await synthesiseWithClaude(prompt)
  if (!briefing) return { ok: false, error: 'Claude synthesis failed' }

  const weekEnding = new Date(
    Date.now() - ((new Date().getDay() + 6) % 7) * 86_400_000,
  ).toISOString().slice(0, 10)

  const { error: upsertErr } = await svc
    .from('jurisdiction_briefings')
    .upsert(
      {
        country_iso2:          countryIso2.toUpperCase(),
        country_name:          countryName,
        week_ending:           weekEnding,
        status:                'published',
        signal_count:          signals.length,
        headline:              briefing.headline,
        legal_status:          briefing.legal_status,
        market_maturity:       briefing.market_maturity,
        summary:               briefing.summary,
        what_changed:          briefing.what_changed,
        operator_implications: briefing.operator_implications,
        whats_coming:          briefing.whats_coming,
        key_signals:           briefing.key_signals,
        model_used:            'claude-sonnet-4-6',
        prompt_version:        PROMPT_VERSION,
        generated_at:          new Date().toISOString(),
      },
      { onConflict: 'country_iso2,week_ending' },
    )

  if (upsertErr) return { ok: false, error: upsertErr.message }
  return { ok: true, briefing, signal_count: signals.length }
}

// ── Fetch latest published briefing for display ───────────────────────────────
export async function getLatestBriefing(
  countryIso2: string,
): Promise<(JurisdictionBriefing & { week_ending: string; signal_count: number }) | null> {
  const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!svcUrl || !anonKey) return null

  const svc = createClient(svcUrl, anonKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })

  const { data, error } = await svc
    .from('jurisdiction_briefings')
    .select('headline, legal_status, market_maturity, summary, what_changed, operator_implications, whats_coming, key_signals, week_ending, signal_count')
    .eq('country_iso2', countryIso2.toUpperCase())
    .eq('status', 'published')
    .order('week_ending', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as JurisdictionBriefing & { week_ending: string; signal_count: number }
}
