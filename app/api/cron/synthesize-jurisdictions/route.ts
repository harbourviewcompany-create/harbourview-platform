// app/api/cron/synthesize-jurisdictions/route.ts
// Vercel Hobby-safe daily cron. Rotates a bounded batch through every active
// market while the synthesis implementation itself rejects stale evidence.

import { NextResponse } from 'next/server'
import { synthesiseJurisdictionBatch } from '@/lib/intelligence/jurisdictionSynthesis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const DEFAULT_BATCH = 4

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '', 10)
  const requestedOffset = Number.parseInt(url.searchParams.get('offset') ?? '', 10)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 10)
    : DEFAULT_BATCH
  const offset = Number.isFinite(requestedOffset) && requestedOffset >= 0
    ? requestedOffset
    : undefined

  console.info('synthesize_jurisdictions_cron: starting bounded freshness batch', { limit, offset })
  const batch = await synthesiseJurisdictionBatch({ limit, offset })
  const succeeded = batch.results.filter(result => result.ok).length
  const failed = batch.results.length - succeeded

  console.info('synthesize_jurisdictions_cron: complete', {
    succeeded,
    failed,
    markets: batch.results.map(result => result.iso2),
  })

  return NextResponse.json({
    ok: batch.ok && failed === 0,
    succeeded,
    failed,
    results: batch.results,
  }, { status: batch.ok ? 200 : 503 })
}
