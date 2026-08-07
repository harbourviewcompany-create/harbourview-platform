import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are Harbourview's executive briefing engine. You receive structured country intelligence data and produce a 2–3 sentence intelligence summary that a senior industry professional can act on immediately.

Rules:
- Ground every claim in the provided data — do not add regulatory details not present in the data
- Be specific about status, access, and opportunity where data is available; acknowledge gaps honestly
- Write in present tense, professional prose — no markdown, no bullet points, no hedging preamble
- Focus on what is actionable for the stated role`

type IntelSnapshot = {
  medical_status: string | null
  market_access_status: string | null
  import_status: string | null
  export_status: string | null
  opportunity_score: number | null
  public_summary: string | null
}

type NormalizedBody = {
  country: string
  role: string
  intel: IntelSnapshot | null
}

const cache = new Map<string, { text: string; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 1000

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value == null) return null
  if (typeof value !== 'string') return undefined
  return value.trim() || null
}

function normalizeIntelSnapshot(value: unknown): IntelSnapshot | null | undefined {
  if (value == null) return null
  if (typeof value !== 'object' || Array.isArray(value)) return undefined

  const record = value as Record<string, unknown>
  const medicalStatus = normalizeOptionalString(record.medical_status)
  const marketAccessStatus = normalizeOptionalString(record.market_access_status)
  const importStatus = normalizeOptionalString(record.import_status)
  const exportStatus = normalizeOptionalString(record.export_status)
  const publicSummary = normalizeOptionalString(record.public_summary)
  const rawOpportunityScore = record.opportunity_score
  const opportunityScore = rawOpportunityScore == null
    ? null
    : typeof rawOpportunityScore === 'number' && Number.isFinite(rawOpportunityScore)
      ? rawOpportunityScore
      : undefined

  if (
    medicalStatus === undefined
    || marketAccessStatus === undefined
    || importStatus === undefined
    || exportStatus === undefined
    || publicSummary === undefined
    || opportunityScore === undefined
  ) {
    return undefined
  }

  return {
    medical_status: medicalStatus,
    market_access_status: marketAccessStatus,
    import_status: importStatus,
    export_status: exportStatus,
    opportunity_score: opportunityScore,
    public_summary: publicSummary,
  }
}

function normalizeBody(body: unknown): NormalizedBody | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const record = body as Record<string, unknown>
  if (record.country != null && typeof record.country !== 'string') return null
  if (record.role != null && typeof record.role !== 'string') return null

  const intel = normalizeIntelSnapshot(record.intel)
  if (intel === undefined) return null

  const country = typeof record.country === 'string' && record.country.trim()
    ? record.country.trim()
    : 'Global'
  const role = typeof record.role === 'string' && record.role.trim()
    ? record.role.trim()
    : 'Operator'

  return { country, role, intel }
}

function buildDeterministicBriefing(country: string, role: string, intel: IntelSnapshot | null) {
  const facts: string[] = []
  if (intel?.medical_status) facts.push(`medical programme: ${intel.medical_status}`)
  if (intel?.market_access_status) facts.push(`market access: ${intel.market_access_status}`)
  if (intel?.import_status) facts.push(`imports: ${intel.import_status}`)
  if (intel?.export_status) facts.push(`exports: ${intel.export_status}`)
  if (intel?.opportunity_score != null) facts.push(`opportunity score: ${intel.opportunity_score}/100`)

  if (facts.length === 0) {
    const recordSummary = intel?.public_summary
    if (recordSummary) {
      return `${recordSummary} For the ${role} context, verify the current access, evidence, and counterparty requirements before taking commercial action.`
    }
    return `${country} does not yet have enough structured intelligence for a detailed executive briefing. For the ${role} context, verify current regulatory, access, and evidence requirements before taking commercial action.`
  }

  return `${country} records currently show ${facts.slice(0, 4).join('; ')}. For the ${role} context, validate the recorded access pathway and supporting evidence before taking commercial action.`
}

function briefingResponse(briefing: string, options: { cached?: boolean; degraded?: boolean } = {}) {
  return NextResponse.json({
    briefing,
    cached: options.cached ?? false,
    degraded: options.degraded ?? false,
    source: options.degraded ? 'deterministic-records' : 'enhanced-briefing',
  })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const normalized = normalizeBody(body)
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid briefing request' }, { status: 400 })
  }

  const { country, role, intel } = normalized
  const fallback = buildDeterministicBriefing(country, role, intel)
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()

  if (!apiKey) {
    return briefingResponse(fallback, { degraded: true })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const rl = rateLimit.get(ip)
  if (rl && rl.resetAt > now) {
    if (rl.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    rl.count += 1
  } else {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
  }

  const cacheKey = JSON.stringify({ country, role, intel })
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return briefingResponse(cached.text, { cached: true })
  }

  const intelLines: string[] = []
  if (intel) {
    if (intel.medical_status) intelLines.push(`Medical programme status: ${intel.medical_status}`)
    if (intel.market_access_status) intelLines.push(`Market access status: ${intel.market_access_status}`)
    if (intel.import_status) intelLines.push(`Import status: ${intel.import_status}`)
    if (intel.export_status) intelLines.push(`Export status: ${intel.export_status}`)
    if (intel.opportunity_score != null) intelLines.push(`Opportunity score: ${intel.opportunity_score}/100`)
    if (intel.public_summary) intelLines.push(`Summary on record: ${intel.public_summary}`)
  }

  const intelBlock = intelLines.length > 0
    ? `\n\nKnown data for this jurisdiction:\n${intelLines.join('\n')}`
    : '\n\nNote: no structured intelligence data is available for this jurisdiction yet.'

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 200,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Jurisdiction: ${country}\nRole: ${role}${intelBlock}\n\nWrite a 2–3 sentence executive intelligence briefing.`,
      }],
    })

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim()

    if (!text) return briefingResponse(fallback, { degraded: true })

    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS })
    return briefingResponse(text)
  } catch (error) {
    console.error('[briefing route]', {
      code: error instanceof Error ? error.name : 'BRIEFING_PROVIDER_FAILED',
    })
    return briefingResponse(fallback, { degraded: true })
  }
}
