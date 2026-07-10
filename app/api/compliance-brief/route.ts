import { NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import Anthropic from '@anthropic-ai/sdk'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { formatOpportunityScore } from '@/lib/dashboard/opportunityScore'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type BriefRequest = {
  profile: CountryIntelProfile
  roleContext?: string
  includeCalendar?: boolean
}

type BriefResponse = {
  brief: string
  country_code: string
  country_name: string
  generated_at: string
  model: string
}

function buildPrompt(profile: CountryIntelProfile, roleContext?: string): string {
  const lines: string[] = []

  lines.push(`You are a senior cannabis regulatory analyst at Harbourview, a global compliance intelligence platform. Generate a concise, professionally formatted compliance brief for the jurisdiction below.`)
  lines.push(``)
  lines.push(`The brief must be factual, jurisdiction-specific, and directly actionable. Do not use hedging language like "it is important to note" or "please be aware". Write as an expert, not a disclaimer machine.`)
  lines.push(``)
  lines.push(`## Jurisdiction Data`)
  lines.push(`Country: ${profile.country_name} (${profile.country_code})`)
  lines.push(`Region: ${profile.region ?? 'Unknown'}`)
  lines.push(``)
  lines.push(`### Status Overview`)
  lines.push(`- Market Access: ${profile.market_access_status ?? '—'}`)
  lines.push(`- Import: ${profile.import_status ?? '—'}`)
  lines.push(`- Export: ${profile.export_status ?? '—'}`)
  lines.push(`- Medical Programme: ${profile.medical_status ?? '—'}`)
  lines.push(`- Adult-Use: ${profile.adult_use_status ?? '—'}`)
  lines.push(`- Opportunity Score: ${formatOpportunityScore(profile.opportunity_score)}`)
  lines.push(`- Data Completeness: ${profile.data_completeness ?? '—'}`)
  lines.push(``)

  if (profile.regulator_label) {
    lines.push(`### Regulatory Authority`)
    lines.push(profile.regulator_label)
    lines.push(``)
  }

  if (profile.briefing_program_status) {
    lines.push(`### Programme Status`)
    lines.push(profile.briefing_program_status)
    lines.push(``)
  }

  if (profile.briefing_regulatory_outlook) {
    lines.push(`### Regulatory Outlook`)
    lines.push(profile.briefing_regulatory_outlook)
    lines.push(``)
  }

  if (profile.commercial_pathway_summary) {
    lines.push(`### Commercial Pathway`)
    lines.push(profile.commercial_pathway_summary)
    lines.push(``)
  }

  if (profile.recentChanges && profile.recentChanges.length > 0) {
    lines.push(`### Recent Regulatory Changes`)
    for (const c of profile.recentChanges.slice(0, 5)) {
      const days = Math.floor((Date.now() - new Date(c.changed_at).getTime()) / 86400000)
      lines.push(`- ${c.field_name.replace(/_/g, ' ')}: ${c.old_value ?? '—'} → ${c.new_value ?? '—'} (${days}d ago)`)
    }
    lines.push(``)
  }

  if (profile.calendarEvents && profile.calendarEvents.length > 0) {
    lines.push(`### Upcoming Regulatory Events`)
    for (const e of profile.calendarEvents.slice(0, 5)) {
      const dateStr = e.expected_date ?? 'TBD'
      lines.push(`- [${dateStr}] ${e.title} (confidence: ${e.confidence})`)
      if (e.summary) lines.push(`  ${e.summary}`)
    }
    lines.push(``)
  }

  if (roleContext) {
    lines.push(`### Operator Context`)
    lines.push(`The reader is a ${roleContext}. Tailor actionable recommendations to this role.`)
    lines.push(``)
  }

  lines.push(`## Brief Format`)
  lines.push(`Generate a compliance brief with these sections (use markdown headers):`)
  lines.push(`1. **Executive Summary** — 2-3 sentence overview of the regulatory position`)
  lines.push(`2. **Current Status** — What is permitted, under what conditions, and by which authority`)
  lines.push(`3. **Key Compliance Requirements** — Bullet list of the most critical requirements for market entry`)
  lines.push(`4. **Commercial Opportunity Assessment** — Who should be paying attention and why`)
  lines.push(`5. **Risk Factors** — Top 3 regulatory risks with brief explanations`)
  lines.push(`6. **Recommended Next Steps** — 3-5 concrete actions, prioritised`)
  lines.push(`7. **Intelligence Quality Note** — One sentence on data confidence and last-known status`)
  lines.push(``)
  lines.push(`Keep the total brief under 600 words. Be direct, specific to this jurisdiction, and commercially useful.`)

  return lines.join('\n')
}

export async function POST(request: Request) {
  // Admin-only: this endpoint invokes the paid Anthropic API to generate briefs.
  // Leaving it open would allow unauthenticated callers to run up API costs.
  const authFailure = await requireAdminApiAuth()
  if (authFailure) return authFailure

  try {
    // Auth: must be a signed-in user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit: 5 briefs per minute per IP (protects Anthropic API spend)
    const ip = getClientIp(request)
    const rl = enforceRateLimit({
      route: '/api/compliance-brief',
      ip,
      identity: user.id,
      limit: 5,
      windowMs: 60_000,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'Compliance brief service not configured' }, { status: 503 })
    }

    let body: BriefRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { profile, roleContext } = body
    if (!profile?.country_code || !profile?.country_name) {
      return NextResponse.json({ error: 'profile.country_code and profile.country_name are required' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey })
    const prompt = buildPrompt(profile, roleContext)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const brief = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const response: BriefResponse = {
      brief,
      country_code: profile.country_code,
      country_name: profile.country_name,
      generated_at: new Date().toISOString(),
      model: message.model,
    }

    return NextResponse.json(response)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
