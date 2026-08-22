/**
 * Ops autonomy tick — runs without human review on commercial queues.
 * CRON_SECRET required. Kill switch: OPS_AUTONOMY_ENABLED=false
 */
import { NextResponse } from 'next/server'
import { runOpsAutonomyTick } from '@/lib/admin/opsAutonomyLoop'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runOpsAutonomyTick({
      autoApproveInScope: true,
      runCoverage: true,
    })
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('ops-autonomy-tick', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
