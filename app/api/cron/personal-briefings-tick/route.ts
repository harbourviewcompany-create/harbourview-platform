import { NextRequest, NextResponse } from 'next/server'
import { listCadenceSubscribersForTick } from '@/lib/intelligence/briefingCadence'
import { generatePersonalBriefing } from '@/lib/intelligence/personalBriefing'
import { sendPersonalBriefingEmail } from '@/lib/intelligence/personalBriefingEmail'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Personal briefing synthesis + optional Resend delivery for active cadence subscribers.
 * Requires CRON_SECRET. Email requires RESEND_API_KEY (same as signal digests).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(req.url).searchParams.get('dry') === '1'
  const skipEmail = new URL(req.url).searchParams.get('no_email') === '1'
  const today = new Date()
  const subscribers = await listCadenceSubscribersForTick({ todayUtc: today, limit: 25 })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://harbourview.co'

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      subscriberCount: subscribers.length,
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      sample: subscribers.slice(0, 3).map((s) => ({
        id: s.id,
        user_id: s.user_id,
        markets: s.markets,
        frequency: s.frequency,
        hasEmail: Boolean(s.email?.includes('@')),
      })),
    })
  }

  let synthesized = 0
  let emailed = 0
  let emailSkipped = 0
  let failed = 0
  const errors: string[] = []

  for (const sub of subscribers) {
    if (sub.markets.length === 0) continue
    try {
      const personal = await generatePersonalBriefing({
        keywords: sub.markets,
        iso2List: sub.markets,
        ruleTypes: ['jurisdiction'],
      })
      synthesized += 1

      if (skipEmail) {
        emailSkipped += 1
        continue
      }

      const result = await sendPersonalBriefingEmail({
        recipientEmail: sub.email,
        narrative: personal.narrative,
        markets: personal.marketsCovered.length > 0 ? personal.marketsCovered : sub.markets,
        source: personal.source,
        frequency: sub.frequency,
        siteUrl,
        unsubscribeUrl: `${siteUrl}/api/signals/subscribe?action=unsubscribe&id=${encodeURIComponent(sub.id)}`,
      })

      if (result.status === 'sent') emailed += 1
      else {
        emailSkipped += 1
        if (result.reason === 'send_failed' && result.error) {
          errors.push(result.error)
        }
      }
    } catch (e) {
      failed += 1
      errors.push(e instanceof Error ? e.message : 'unknown')
    }
  }

  return NextResponse.json({
    ok: true,
    subscriberCount: subscribers.length,
    synthesized,
    emailed,
    emailSkipped,
    failed,
    errors: errors.slice(0, 5),
  })
}
