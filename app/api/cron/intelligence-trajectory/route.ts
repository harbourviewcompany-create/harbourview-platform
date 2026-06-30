// app/api/cron/intelligence-trajectory/route.ts
// Vercel Cron — runs daily at 13:00 UTC (after intelligence-extract at 04:00).
//
// Two jobs per invocation:
//   1. content_change_rate refresh: recomputes per-source change rate from last-30-day
//      source_snapshots so yield-aware scheduling uses real data instead of the 0.5 default.
//   2. Trajectory classification: for each jurisdiction with ia_signals in the last
//      LOOK_BACK_DAYS, uses Claude Haiku to classify regulatory trajectory
//      (liberalising/tightening/stable/uncertain) and extract key themes,
//      then upserts into hv_regulatory_trajectory.
//
// Required env vars:
//   CRON_SECRET            — shared bearer token
//   ANTHROPIC_API_KEY      — Claude Haiku for trajectory classification
//   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const dynamic    = 'force-dynamic'
export const maxDuration = 300

const LOOK_BACK_DAYS     = 90
const MAX_JURISDICTIONS  = 40

// ISO-2 → display name (superset of the extract route's map)
const ISO_TO_NAME: Record<string, string> = {
  US: 'United States', CA: 'Canada', DE: 'Germany', AU: 'Australia', GB: 'United Kingdom',
  NL: 'Netherlands', PT: 'Portugal', IL: 'Israel', CO: 'Colombia', BR: 'Brazil',
  MX: 'Mexico', CH: 'Switzerland', AT: 'Austria', CZ: 'Czech Republic', DK: 'Denmark',
  SE: 'Sweden', NO: 'Norway', PL: 'Poland', ZA: 'South Africa', TH: 'Thailand',
  MT: 'Malta', IT: 'Italy', FR: 'France', ES: 'Spain', NZ: 'New Zealand',
  JM: 'Jamaica', UY: 'Uruguay', AR: 'Argentina', CL: 'Chile', PE: 'Peru',
  EC: 'Ecuador', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', MA: 'Morocco',
  LS: 'Lesotho', SZ: 'Eswatini', LB: 'Lebanon', TR: 'Turkey', IN: 'India',
  SG: 'Singapore', JP: 'Japan', KR: 'South Korea', PH: 'Philippines', MY: 'Malaysia',
  ZW: 'Zimbabwe', LU: 'Luxembourg', GR: 'Greece',
}

const TrajectorySchema = z.object({
  trajectory:     z.enum(['liberalising', 'tightening', 'stable', 'uncertain', 'no_data']),
  sentiment_score: z.number().min(-1).max(1),
  key_themes:     z.array(z.string()).max(8),
  summary_text:   z.string().max(1000),
})

type TrajectoryResult = z.infer<typeof TrajectorySchema>

async function classifyTrajectory(
  client: Anthropic,
  country: string,
  signals: Array<{ title: string; summary: string; commercial_impact: string }>,
): Promise<TrajectoryResult | null> {
  const snippets = signals
    .slice(0, 20)
    .map(s => `• [${s.commercial_impact}] ${s.title}: ${s.summary.slice(0, 200)}`)
    .join('\n')

  const prompt = `You are a regulatory intelligence analyst for the global cannabis industry.

Based on these ${signals.length} regulatory signal(s) from ${country} over the last ${LOOK_BACK_DAYS} days, classify the regulatory trajectory.

Signals:
${snippets}

Respond with ONLY a JSON object — no markdown, no explanation:
{
  "trajectory": "liberalising" | "tightening" | "stable" | "uncertain" | "no_data",
  "sentiment_score": <float -1.0 to 1.0; -1=strongly tightening, 0=neutral, 1=strongly liberalising>,
  "key_themes": ["theme1", "theme2", "theme3"],
  "summary_text": "<2-3 sentences summarising the regulatory trajectory in ${country}>"
}`

  try {
    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text      = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = TrajectorySchema.safeParse(JSON.parse(jsonMatch[0]))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('intelligence_trajectory_cron: ANTHROPIC_API_KEY not set — skipping trajectory classification')
    return NextResponse.json({ ok: false, reason: 'ANTHROPIC_API_KEY not configured' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // ── 1. Refresh content_change_rate ──────────────────────────────────────────
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data: recentSnaps } = await supabase
    .from('source_snapshots')
    .select('source_id, changed')
    .gte('captured_at', since30d)

  const rateMap = new Map<string, { total: number; changed: number }>()
  for (const row of (recentSnaps ?? []) as Array<{ source_id: string; changed: boolean | null }>) {
    const entry = rateMap.get(row.source_id) ?? { total: 0, changed: 0 }
    entry.total++
    if (row.changed) entry.changed++
    rateMap.set(row.source_id, entry)
  }

  let ratesUpdated = 0
  for (const [sourceId, { total, changed }] of rateMap) {
    const rate = total > 0 ? changed / total : 0.5
    const { error } = await supabase
      .from('source_registry')
      .update({ content_change_rate: Math.round(rate * 1000) / 1000 })
      .eq('id', sourceId)
    if (!error) ratesUpdated++
  }

  console.info(`intelligence_trajectory_cron: updated content_change_rate for ${ratesUpdated} sources`)

  // ── 2. Trajectory classification per jurisdiction ───────────────────────────
  const since = new Date(Date.now() - LOOK_BACK_DAYS * 86_400_000).toISOString()

  // Fetch signals grouped by market from ia_signals
  const { data: signals } = await supabase
    .from('ia_signals')
    .select('market, title, summary, commercial_impact, detected_at')
    .gte('detected_at', since.slice(0, 10))
    .order('detected_at', { ascending: false })

  // Group by market
  const byMarket = new Map<string, Array<{ title: string; summary: string; commercial_impact: string }>>()
  for (const sig of (signals ?? []) as Array<{ market: string; title: string; summary: string; commercial_impact: string }>) {
    const list = byMarket.get(sig.market) ?? []
    list.push({ title: sig.title, summary: sig.summary, commercial_impact: sig.commercial_impact })
    byMarket.set(sig.market, list)
  }

  // Reverse map: display name → ISO-2
  const nameToIso = new Map<string, string>(
    Object.entries(ISO_TO_NAME).map(([iso, name]) => [name, iso])
  )

  // Also enrich with hv_artifacts (jurisdiction_code is the ISO code directly)
  const { data: artRows } = await supabase
    .from('hv_artifacts')
    .select('jurisdiction_code, title, body')
    .gte('created_at', since)
    .not('jurisdiction_code', 'is', null)
    .eq('object_class', 'ai_summary')

  const byIso = new Map<string, Array<{ title: string; summary: string; commercial_impact: string }>>()
  for (const art of (artRows ?? []) as Array<{ jurisdiction_code: string; title: string; body: string }>) {
    const iso  = art.jurisdiction_code
    const list = byIso.get(iso) ?? []
    list.push({ title: art.title, summary: art.body?.slice(0, 300) ?? '', commercial_impact: 'medium' })
    byIso.set(iso, list)
  }

  // Merge ia_signals groups into byIso
  for (const [marketName, sigs] of byMarket) {
    const iso = nameToIso.get(marketName)
    if (!iso) continue
    const existing = byIso.get(iso) ?? []
    byIso.set(iso, [...existing, ...sigs])
  }

  const periodStart = since.slice(0, 10)
  const periodEnd   = new Date().toISOString().slice(0, 10)

  let classified = 0, classifyFailed = 0

  const jurisdictions = [...byIso.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_JURISDICTIONS)

  for (const [iso, sigs] of jurisdictions) {
    const country     = ISO_TO_NAME[iso] ?? iso
    const signalCount = sigs.length

    const result = await classifyTrajectory(anthropic, country, sigs)

    if (!result) {
      classifyFailed++
      continue
    }

    const { error } = await supabase
      .from('hv_regulatory_trajectory')
      .upsert(
        {
          iso,
          jurisdiction:    country,
          period_start:    periodStart,
          period_end:      periodEnd,
          signal_count:    signalCount,
          change_count:    sigs.filter(s => s.commercial_impact === 'high').length,
          sentiment_score: result.sentiment_score,
          trajectory:      result.trajectory,
          key_themes:      result.key_themes,
          summary_text:    result.summary_text,
          computed_at:     new Date().toISOString(),
        },
        { onConflict: 'iso,period_start,period_end' },
      )

    if (error) {
      console.error(`intelligence_trajectory_cron: upsert failed for ${iso}:`, error.message)
      classifyFailed++
    } else {
      classified++
    }
  }

  const summary = {
    ok: true,
    rates_updated:      ratesUpdated,
    jurisdictions_seen: byIso.size,
    classified,
    classify_failed:    classifyFailed,
  }
  console.info('intelligence_trajectory_cron: run complete', summary)
  return NextResponse.json(summary)
}
