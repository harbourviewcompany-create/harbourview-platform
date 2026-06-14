// app/api/cron/regulatory-watch/route.ts
// Vercel Cron route — runs the Fresh Regulatory Sources watcher on a schedule,
// cycling through regulatory_signals.sources (oldest-checked-first) so the
// full registry (172 sources / 77 countries) gets re-checked over time.
// Creates source_check_runs / source_snapshots for every source checked, and
// draft signals (review_status='captured', public_safe=false) in
// regulatory_signals.signals for relevant items, awaiting human review at
// /admin/signals/review before they can reach the public feed.
//
// Secured by CRON_SECRET so only Vercel can trigger it.

import { NextResponse } from 'next/server'
import { runRegulatoryWatch } from '@/lib/regulatory-sources/runWatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — Vercel Pro allows up to 300s

// Sources per run. Vercel Hobby plan only allows daily cron schedules, so
// this runs once/day. At 30/run, the full 172-source registry cycles
// roughly every 6 days.
const SOURCES_PER_RUN = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.info('regulatory_watch_cron: starting run')

  try {
    const summary = await runRegulatoryWatch(SOURCES_PER_RUN)

    if (!summary.ok) {
      console.error('regulatory_watch_cron: fatal error:', summary.error)
      return NextResponse.json({ ok: false, error: summary.error }, { status: 500 })
    }

    console.info('regulatory_watch_cron: run complete', {
      checked: summary.checked,
      successful: summary.successful,
      snapshots_created: summary.snapshots_created,
      draft_signals: summary.draft_signals_created_or_existing,
    })

    return NextResponse.json({
      ok: true,
      checked: summary.checked,
      successful: summary.successful,
      snapshots_created: summary.snapshots_created,
      draft_signals_created_or_existing: summary.draft_signals_created_or_existing,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('regulatory_watch_cron: fatal error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
