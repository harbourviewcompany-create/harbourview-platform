/**
 * Daily country coverage tick — keeps registry floors + enrichment queue warm.
 * Secured by CRON_SECRET (Vercel Cron).
 */
import { NextResponse } from 'next/server'
import { runCountryCoverageTick } from '@/lib/admin/countryCoverageLoop'

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
    const result = await runCountryCoverageTick({
      applyPriority: true,
      enqueueEnrichment: true,
    })
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('country-coverage-tick', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
