// app/api/cron/marketplace-match/route.ts
// Vercel Cron — runs the full marketplace matching pass.
// Finds all approved listings with no matches against active buyer_requests,
// creates match rows, and optionally triggers deal room creation for
// auto-approved categories. Then backfills AI rationale for any matches
// (from this run or prior ones) still missing one — see matchEngine.ts.
//
// Run schedule: daily at 14:00 UTC (see vercel.json)
// Also called manually from the admin hub to backfill existing inventory.

import { NextResponse } from 'next/server'
import { runFullMarketplaceMatch, backfillMatchRationales } from '@/lib/marketplace/matchEngine'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await runFullMarketplaceMatch()
    console.info('marketplace_match_cron: complete', result)

    // Best-effort AI rationale backfill, decoupled from match creation above.
    // Never blocks or fails the cron response — see matchEngine.ts doc comment.
    const rationalesBackfilled = await backfillMatchRationales().catch((err) => {
      console.error('marketplace_match_cron: rationale backfill failed', err instanceof Error ? err.message : err)
      return 0
    })

    return NextResponse.json({ ok: true, ...result, rationalesBackfilled })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('marketplace_match_cron: error', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
