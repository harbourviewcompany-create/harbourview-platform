// POST /api/intelligence/synthesize
// Synthesises a jurisdiction briefing for one country using Claude.
// Protected by CRON_SECRET — only callable from cron or admin contexts.

import { NextResponse } from 'next/server'
import { synthesiseJurisdiction } from '@/lib/intelligence/jurisdictionSynthesis'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { country_iso2?: string; country_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { country_iso2, country_name } = body
  if (!country_iso2 || !country_name) {
    return NextResponse.json({ error: 'country_iso2 and country_name are required' }, { status: 400 })
  }

  const iso2 = country_iso2.toUpperCase().trim()
  if (!/^[A-Z]{2}$/.test(iso2)) {
    return NextResponse.json({ error: 'country_iso2 must be a 2-letter ISO code' }, { status: 400 })
  }

  console.info(`jurisdiction_synthesize: starting ${iso2} (${country_name})`)

  const result = await synthesiseJurisdiction(iso2, country_name.trim())

  if (!result.ok) {
    console.error(`jurisdiction_synthesize: failed for ${iso2} — ${result.error}`)
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  console.info(`jurisdiction_synthesize: ${iso2} done (${result.signal_count} signals)`)
  return NextResponse.json({
    ok: true,
    country_iso2: iso2,
    signal_count: result.signal_count,
    headline: result.briefing.headline,
  })
}
