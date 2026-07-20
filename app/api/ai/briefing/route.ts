import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are Harbourview's executive briefing engine. You receive structured country intelligence data and produce a 2–3 sentence intelligence summary that a senior industry professional can act on immediately.

Rules:
- Ground every claim in the provided data — do not add regulatory details not present in the data
- Be specific about status, access, and opportunity where data is available; acknowledge gaps honestly
- Write in present tense, professional prose — no markdown, no bullet points, no hedging preamble
- Focus on what is actionable for the stated role`

type IntelSnapshot = {
  medical_status?:       string | null
  market_access_status?: string | null
  import_status?:        string | null
  export_status?:        string | null
  opportunity_score?:    number | null
  public_summary?:       string | null
}

type Body = {
  country?: unknown
  role?:    unknown
  intel?:   unknown
}

const cache = new Map<string, { text: string; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 1000

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const rl = rateLimit.get(ip)
    if (rl && rl.resetAt > now) {
      if (rl.count >= RATE_LIMIT) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
      rl.count++
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    }

    const body = (await request.json()) as Body
    const country = typeof body.country === 'string' ? body.country.trim() : 'Global'
    const role    = typeof body.role    === 'string' ? body.role.trim()    : 'Operator'
    const intel   = (body.intel && typeof body.intel === 'object' && !Array.isArray(body.intel))
      ? (body.intel as IntelSnapshot)
      : null

    const cacheKey = `${country}:${role}:${intel?.medical_status ?? ''}:${intel?.market_access_status ?? ''}:${intel?.opportunity_score ?? ''}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ briefing: cached.text, cached: true })
    }

    const intelLines: string[] = []
    if (intel) {
      if (intel.medical_status)       intelLines.push(`Medical programme status: ${intel.medical_status}`)
      if (intel.market_access_status) intelLines.push(`Market access status: ${intel.market_access_status}`)
      if (intel.import_status)        intelLines.push(`Import status: ${intel.import_status}`)
      if (intel.export_status)        intelLines.push(`Export status: ${intel.export_status}`)
      if (intel.opportunity_score != null) intelLines.push(`Opportunity score: ${intel.opportunity_score}/100`)
      if (intel.public_summary)       intelLines.push(`Summary on record: ${intel.public_summary}`)
    }

    const intelBlock = intelLines.length > 0
      ? `\n\nKnown data for this jurisdiction:\n${intelLines.join('\n')}`
      : '\n\nNote: no structured intelligence data is available for this jurisdiction yet.'

    const message = await client.messages.create({
      model:      'claude-sonnet-5',
      max_tokens: 200,
      system:     [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages:   [{
        role:    'user',
        content: `Jurisdiction: ${country}\nRole: ${role}${intelBlock}\n\nWrite a 2–3 sentence executive intelligence briefing.`,
      }],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS })

    return NextResponse.json({ briefing: text })
  } catch (error) {
    console.error('[briefing route]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 },
    )
  }
}
