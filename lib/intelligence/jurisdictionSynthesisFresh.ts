import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { inferEventEffectiveAt } from '@/lib/dashboard/signalFreshness'
import {
  SIGNAL_QUALITY_SELECT,
  QUALITY_LABEL_NOT_IN,
  resolveConfidence,
  type SignalQualityRow,
} from '@/lib/signals/quality'

const TIMELINE_SELECT = `headline, country, date, created_at, source_published_at, event_effective_at, observed_at, ingested_at, top_lane, cat, commercial_impact, pri, reviewed, ${SIGNAL_QUALITY_SELECT}` as const
const LEGACY_SELECT = `headline, country, date, created_at, top_lane, cat, commercial_impact, pri, reviewed, ${SIGNAL_QUALITY_SELECT}` as const
const PRIMARY_WINDOW_DAYS = 30
const FALLBACK_WINDOW_DAYS = 45
const DAY_MS = 86_400_000
const CLAUDE_MODEL = 'claude-sonnet-4-6'
const DETERMINISTIC_MODEL = 'deterministic-bounded-v1'

let claudeCircuitOpen = false

export const SYNTHESIS_MARKETS: { iso2: string; name: string }[] = [
  { iso2: 'DE', name: 'Germany' },
  { iso2: 'GB', name: 'United Kingdom' },
  { iso2: 'AU', name: 'Australia' },
  { iso2: 'CA', name: 'Canada' },
  { iso2: 'US', name: 'United States' },
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
  { iso2: 'IT', name: 'Italy' },
  { iso2: 'DK', name: 'Denmark' },
  { iso2: 'SE', name: 'Sweden' },
  { iso2: 'NO', name: 'Norway' },
  { iso2: 'AT', name: 'Austria' },
  { iso2: 'BE', name: 'Belgium' },
  { iso2: 'IE', name: 'Ireland' },
  { iso2: 'JP', name: 'Japan' },
  { iso2: 'KR', name: 'South Korea' },
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

export type StoredJurisdictionBriefing = JurisdictionBriefing & {
  week_ending: string
  signal_count: number
  generated_at: string
}

type SignalRow = SignalQualityRow & {
  headline: string
  country: string | null
  date: string | null
  created_at: string | null
  source_published_at?: string | null
  event_effective_at?: string | null
  observed_at?: string | null
  ingested_at?: string | null
  top_lane: string | null
  cat: string | null
  commercial_impact: string | null
  pri: string | null
}

function ms(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function rowFreshnessMs(row: SignalRow) {
  const source = ms(row.source_published_at)
  if (source != null) return source

  const event = ms(row.event_effective_at) ?? ms(inferEventEffectiveAt(row.headline))
  const legacy = ms(row.date)
  if (event != null && legacy != null && legacy - event > FALLBACK_WINDOW_DAYS * DAY_MS) return event
  if (legacy != null) return legacy
  if (event != null) return event
  return ms(row.observed_at) ?? ms(row.ingested_at) ?? ms(row.created_at)
}

function isTimelineGap(message: string | undefined) {
  const value = (message ?? '').toLowerCase()
  return ['source_published_at', 'event_effective_at', 'observed_at', 'ingested_at']
    .some(column => value.includes(column) && (value.includes('column') || value.includes('schema cache')))
}

async function fetchSignalsForCountry(
  svcUrl: string,
  svcKey: string,
  countryName: string,
): Promise<SignalRow[]> {
  const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const createdCutoff = new Date(Date.now() - FALLBACK_WINDOW_DAYS * DAY_MS).toISOString()

  const run = (selectFields: string) => svc
    .from('signals_with_quality')
    .select(selectFields)
    .eq('reviewed', true)
    .gte('created_at', createdCutoff)
    .ilike('country', `%${countryName}%`)
    .not('quality_label', 'in', QUALITY_LABEL_NOT_IN)
    .order('date', { ascending: false, nullsFirst: false })
    .order('quality_confidence', { ascending: false, nullsFirst: false })
    .limit(80)

  let result = await run(TIMELINE_SELECT)
  if (result.error && isTimelineGap(result.error.message)) result = await run(LEGACY_SELECT)
  if (result.error) throw new Error(result.error.message)

  const rows = (result.data ?? []) as unknown as SignalRow[]
  const now = Date.now()
  const primaryCutoff = now - PRIMARY_WINDOW_DAYS * DAY_MS
  const fallbackCutoff = now - FALLBACK_WINDOW_DAYS * DAY_MS
  const bounded = rows
    .map(row => ({ row, freshness: rowFreshnessMs(row) }))
    .filter(entry => entry.freshness != null && entry.freshness >= fallbackCutoff && entry.freshness <= now + 90 * DAY_MS)
    .sort((a, b) => (b.freshness ?? 0) - (a.freshness ?? 0) || (resolveConfidence(b.row) ?? 0) - (resolveConfidence(a.row) ?? 0))

  const primary = bounded.filter(entry => (entry.freshness ?? 0) >= primaryCutoff)
  const chosen = primary.length >= 3 ? primary : bounded
  return chosen.slice(0, 30).map(entry => entry.row)
}

function formatSignalsForPrompt(signals: SignalRow[]): string {
  if (signals.length === 0) {
    return `No qualifying reviewed signals were found in the bounded ${FALLBACK_WINDOW_DAYS}-day freshness window. Treat this as sparse evidence, not permission to reuse older developments.`
  }
  return signals
    .map((s, i) => {
      const conf = resolveConfidence(s as SignalQualityRow)
      const score = conf !== null ? ` [confidence: ${conf}]` : ''
      const lane = s.top_lane ? ` | lane: ${s.top_lane}` : ''
      const impact = s.commercial_impact ? `\n   Impact: ${s.commercial_impact}` : ''
      return `${i + 1}. ${s.headline}${score}${lane}${impact}`
    })
    .join('\n\n')
}

const PROMPT_VERSION = 3

function buildPrompt(countryName: string, signalText: string): string {
  return `You are an expert analyst at Harbourview, the global cannabis industry intelligence platform.
Your task: synthesise a current jurisdiction intelligence briefing for ${countryName} using only the bounded recent evidence below.

Audience: licensed cannabis operators, importers/exporters, compliance professionals, clinicians, and investors.

RECENT REVIEWED SIGNALS FOR ${countryName.toUpperCase()}:
${signalText}

Produce a JSON object with EXACTLY these fields — no extra fields, no markdown fences:
{
  "headline": "One specific sentence summarising the most important current development, or explicitly saying the current evidence window is sparse.",
  "legal_status": "EXACTLY one of: medical_only | adult_use | decrim | illegal | mixed | transitional | unknown",
  "market_maturity": "EXACTLY one of: emerging | developing | maturing | mature | restricted | unknown",
  "summary": "2–3 sentences describing only what the supplied recent evidence supports.",
  "what_changed": "1–2 sentences on meaningful change in the supplied evidence window, or null when there is no supported change.",
  "operator_implications": "2–3 sentences of evidence-grounded operator implications, or a sparse-evidence statement when appropriate.",
  "whats_coming": "1–2 sentences on evidenced near-term developments, or null if insufficient.",
  "key_signals": ["0–5 exact signal headlines from the supplied list, verbatim"]
}

Rules:
- Never import an older event merely because it has high confidence.
- Never treat observation/ingestion time as source publication or event-effective time.
- Do not invent regulations, counterparties, dates, or market status.
- If the evidence window is sparse or empty, say so plainly instead of filling gaps from general knowledge.
- key_signals must be exact strings from the list when present.
- Respond with valid JSON only.`
}

function deterministicBriefing(countryName: string, signals: SignalRow[], reason: string): JurisdictionBriefing {
  const keySignals = signals.slice(0, 5).map(signal => signal.headline)
  if (signals.length === 0) {
    return {
      headline: `${countryName}: no qualifying reviewed signals in the current ${FALLBACK_WINDOW_DAYS}-day evidence window.`,
      legal_status: 'unknown',
      market_maturity: 'unknown',
      summary: `No qualifying reviewed ${countryName} signals were found inside the bounded freshness window. Older developments were intentionally not reused.`,
      what_changed: null,
      operator_implications: `Current evidence is sparse. Verify the jurisdiction directly before relying on an older briefing; automated language-model synthesis is unavailable (${reason}).`,
      whats_coming: null,
      key_signals: [],
    }
  }

  const top = signals[0]
  const second = signals[1]
  const evidenceSummary = second
    ? `The two most recent qualifying reviewed signals are: ${top.headline} ${second.headline}`
    : `The most recent qualifying reviewed signal is: ${top.headline}`

  return {
    headline: top.headline,
    legal_status: 'unknown',
    market_maturity: 'unknown',
    summary: `This current ${countryName} briefing is based on ${signals.length} reviewed signal${signals.length === 1 ? '' : 's'} inside the bounded ${FALLBACK_WINDOW_DAYS}-day evidence window. ${evidenceSummary}`,
    what_changed: top.headline,
    operator_implications: top.commercial_impact
      ? `${top.commercial_impact} Automated language-model synthesis is unavailable (${reason}); use the cited current evidence for verification.`
      : `Review the cited current evidence before taking jurisdiction-specific action. Automated language-model synthesis is unavailable (${reason}), so no additional interpretation has been invented.`,
    whats_coming: null,
    key_signals: keySignals,
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function shouldOpenClaudeCircuit(message: string): boolean {
  const value = message.toLowerCase()
  return [
    'credit balance is too low',
    'plans & billing',
    'authentication_error',
    'invalid x-api-key',
    'permission_error',
  ].some(marker => value.includes(marker))
}

async function synthesiseWithClaude(prompt: string): Promise<JurisdictionBriefing | null> {
  if (claudeCircuitOpen) return null

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    claudeCircuitOpen = true
    console.warn('jurisdiction_synthesis: ANTHROPIC_API_KEY not configured; deterministic bounded fallback active')
    return null
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
      .trim()
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    try {
      const parsed = JSON.parse(clean)
      if (typeof parsed.headline !== 'string' || typeof parsed.summary !== 'string') return null
      return {
        headline: String(parsed.headline ?? '').trim(),
        legal_status: String(parsed.legal_status ?? 'unknown').trim(),
        market_maturity: String(parsed.market_maturity ?? 'unknown').trim(),
        summary: String(parsed.summary ?? '').trim(),
        what_changed: parsed.what_changed ? String(parsed.what_changed).trim() : null,
        operator_implications: parsed.operator_implications ? String(parsed.operator_implications).trim() : null,
        whats_coming: parsed.whats_coming ? String(parsed.whats_coming).trim() : null,
        key_signals: Array.isArray(parsed.key_signals) ? parsed.key_signals.map(String).slice(0, 5) : [],
      }
    } catch (error) {
      console.error('jurisdiction_synthesis: JSON parse error; deterministic bounded fallback active', error, 'raw:', clean.slice(0, 200))
      return null
    }
  } catch (error) {
    const message = errorMessage(error)
    if (shouldOpenClaudeCircuit(message)) claudeCircuitOpen = true
    console.error('jurisdiction_synthesis: Claude unavailable; deterministic bounded fallback active', message)
    return null
  }
}

export async function synthesiseJurisdiction(
  countryIso2: string,
  countryName: string,
): Promise<
  | { ok: true; briefing: JurisdictionBriefing; signal_count: number; model_used: string }
  | { ok: false; error: string }
> {
  const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!svcUrl || !svcKey) return { ok: false, error: 'Supabase env vars missing' }

  const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const signals = await fetchSignalsForCountry(svcUrl, svcKey, countryName)
  const claudeBriefing = await synthesiseWithClaude(buildPrompt(countryName, formatSignalsForPrompt(signals)))
  const providerReason = claudeCircuitOpen ? 'provider billing/authentication unavailable' : 'provider response unavailable'
  const briefing = claudeBriefing ?? deterministicBriefing(countryName, signals, providerReason)
  const modelUsed = claudeBriefing ? CLAUDE_MODEL : DETERMINISTIC_MODEL

  const now = new Date()
  const weekEnding = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - ((now.getUTCDay() + 6) % 7),
  )).toISOString().slice(0, 10)

  const { error } = await svc
    .from('jurisdiction_briefings')
    .upsert({
      country_iso2: countryIso2.toUpperCase(),
      country_name: countryName,
      week_ending: weekEnding,
      status: 'published',
      signal_count: signals.length,
      headline: briefing.headline,
      legal_status: briefing.legal_status,
      market_maturity: briefing.market_maturity,
      summary: briefing.summary,
      what_changed: briefing.what_changed,
      operator_implications: briefing.operator_implications,
      whats_coming: briefing.whats_coming,
      key_signals: briefing.key_signals,
      model_used: modelUsed,
      prompt_version: PROMPT_VERSION,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'country_iso2,week_ending' })

  if (error) return { ok: false, error: error.message }
  return { ok: true, briefing, signal_count: signals.length, model_used: modelUsed }
}

export async function getLatestBriefing(countryIso2: string): Promise<StoredJurisdictionBriefing | null> {
  const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!svcUrl || !anonKey) return null

  const svc = createClient(svcUrl, anonKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const { data, error } = await svc
    .from('jurisdiction_briefings')
    .select('headline, legal_status, market_maturity, summary, what_changed, operator_implications, whats_coming, key_signals, week_ending, signal_count, generated_at')
    .eq('country_iso2', countryIso2.toUpperCase())
    .eq('status', 'published')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as StoredJurisdictionBriefing
}

export async function synthesiseJurisdictionBatch(opts?: {
  limit?: number
  offset?: number
}): Promise<{
  ok: boolean
  results: { iso2: string; ok: boolean; signal_count?: number; model_used?: string; error?: string }[]
}> {
  const limit = Math.min(Math.max(opts?.limit ?? 6, 1), 10)
  const dayIndex = Math.floor(Date.now() / DAY_MS)
  const base = opts?.offset ?? (dayIndex * limit) % SYNTHESIS_MARKETS.length
  const slice: typeof SYNTHESIS_MARKETS = []
  for (let i = 0; i < limit; i++) slice.push(SYNTHESIS_MARKETS[(base + i) % SYNTHESIS_MARKETS.length])

  const results: { iso2: string; ok: boolean; signal_count?: number; model_used?: string; error?: string }[] = []
  for (const market of slice) {
    try {
      const result = await synthesiseJurisdiction(market.iso2, market.name)
      results.push({
        iso2: market.iso2,
        ok: result.ok,
        signal_count: result.ok ? result.signal_count : undefined,
        model_used: result.ok ? result.model_used : undefined,
        error: result.ok ? undefined : result.error,
      })
    } catch (error) {
      results.push({
        iso2: market.iso2,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { ok: results.some(result => result.ok), results }
}
