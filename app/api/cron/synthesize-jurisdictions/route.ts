// app/api/cron/synthesize-jurisdictions/route.ts
// Vercel Cron — runs every Monday at 03:00 UTC.
// Synthesises weekly jurisdiction briefings for all active markets using Claude.
//
// Required env vars:
//   CRON_SECRET         — shared with other cron routes
//   ANTHROPIC_API_KEY   — Claude API access
//   SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL

import { NextResponse } from 'next/server'
import { synthesiseJurisdiction, SYNTHESIS_MARKETS } from '@/lib/intelligence/jurisdictionSynthesis'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.info(`synthesize_jurisdictions_cron: starting run — ${SYNTHESIS_MARKETS.length} markets`)

  const results: { iso2: string; ok: boolean; signal_count?: number; error?: string }[] = []

  // Sequential to avoid Anthropic rate limits
  for (const market of SYNTHESIS_MARKETS) {
    try {
      const result = await synthesiseJurisdiction(market.iso2, market.name)
      results.push({
        iso2: market.iso2,
        ok: result.ok,
        signal_count: result.ok ? result.signal_count : undefined,
        error: result.ok ? undefined : result.error,
      })
      console.info(`synthesize_jurisdictions_cron: ${market.iso2} ${result.ok ? 'ok' : 'failed — ' + (result as { error: string }).error}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`synthesize_jurisdictions_cron: ${market.iso2} threw — ${msg}`)
      results.push({ iso2: market.iso2, ok: false, error: msg })
    }
  }

  const succeeded = results.filter(r => r.ok).length
  const failed    = results.filter(r => !r.ok).length

  console.info(`synthesize_jurisdictions_cron: complete — ${succeeded} ok, ${failed} failed`)

  return NextResponse.json({
    ok: true,
    succeeded,
    failed,
    results,
  })
}
