// app/api/cron/scrape/route.ts
// Vercel Cron route — runs the scrape engine on a schedule.
// Secured by CRON_SECRET so only Vercel can trigger it.

import { NextResponse } from 'next/server'
import { runScrapeEngine } from '@/lib/scrapers/runner'
import { sendScrapeDigest } from '@/lib/scrapers/digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — Vercel Pro allows up to 300s

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.info('scrape_cron: starting run')

  try {
    const summary = await runScrapeEngine()

    console.info('scrape_cron: run complete', {
      runId: summary.runId,
      totalInserted: summary.totalInserted,
      totalSkipped: summary.totalSkipped,
      totalFailed: summary.totalFailed,
    })

    // Send digest email (non-blocking — we return success regardless)
    sendScrapeDigest(summary).catch((err) => {
      console.warn('scrape_cron: digest email failed:', err instanceof Error ? err.message : String(err))
    })

    return NextResponse.json({
      ok: true,
      runId: summary.runId,
      totalInserted: summary.totalInserted,
      totalSkipped: summary.totalSkipped,
      totalFailed: summary.totalFailed,
      sourceCount: summary.sourceResults.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('scrape_cron: fatal error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
