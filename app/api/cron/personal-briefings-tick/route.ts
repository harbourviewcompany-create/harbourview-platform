import { NextRequest, NextResponse } from 'next/server'
import { listCadenceSubscribersForTick } from '@/lib/intelligence/briefingCadence'
import { generatePersonalBriefing } from '@/lib/intelligence/personalBriefing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Warm-path personal briefing synthesis for active cadence subscribers.
 * Does not send email yet — that remains Phase 2 delivery (signal_subscriptions
 * email path already exists for signal digests). This tick validates that LLM
 * synthesis runs for daily/weekly cohorts without blocking the request path.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(req.url).searchParams.get('dry') === '1'
  const today = new Date()
  const subscribers = await listCadenceSubscribersForTick({ todayUtc: today, limit: 25 })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      subscriberCount: subscribers.length,
      sample: subscribers.slice(0, 3).map((s) => ({
        user_id: s.user_id,
        markets: s.markets,
        frequency: s.frequency,
      })),
    })
  }

  let synthesized = 0
  let failed = 0
  const errors: string[] = []

  for (const sub of subscribers) {
    if (sub.markets.length === 0) continue
    try {
      await generatePersonalBriefing({
        keywords: sub.markets,
        iso2List: sub.markets,
        ruleTypes: ['jurisdiction'],
      })
      synthesized += 1
    } catch (e) {
      failed += 1
      errors.push(e instanceof Error ? e.message : 'unknown')
    }
  }

  return NextResponse.json({
    ok: true,
    subscriberCount: subscribers.length,
    synthesized,
    failed,
    errors: errors.slice(0, 5),
  })
}
