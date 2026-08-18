// Vercel Cron — clinical source-metadata currentness (Phase A+)
// Secured by CRON_SECRET. Does not publish clinical-synthesis.

import { NextResponse } from 'next/server'
import { runSourceCurrentness } from '@/lib/clinical/sourceCurrentness'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DEFAULT_LIMIT = 40

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam
    ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || DEFAULT_LIMIT))
    : DEFAULT_LIMIT
  const dryRun = url.searchParams.get('dryRun') === '1'

  console.info('clinical_source_currentness_cron: starting', { limit, dryRun })

  try {
    const summary = await runSourceCurrentness({ limit, dryRun })
    if (!summary.ok && !summary.skippedLock) {
      console.error('clinical_source_currentness_cron: failed', summary.error)
      return NextResponse.json(summary, { status: 500 })
    }
    console.info('clinical_source_currentness_cron: complete', summary)
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('clinical_source_currentness_cron: fatal', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
