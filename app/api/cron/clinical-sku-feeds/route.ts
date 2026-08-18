import { NextRequest, NextResponse } from 'next/server'
import { runClinicalSkuFeeds } from '@/lib/server/clinicalSkuFeedRunner'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Cron: refresh ANVISA + TGA formulary SKU feeds.
 * Secured by CRON_SECRET (Authorization: Bearer <secret> or ?secret=).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const q = request.nextUrl.searchParams.get('secret')
  const ok =
    !!secret &&
    (auth === `Bearer ${secret}` || q === secret)

  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runClinicalSkuFeeds()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Feed run failed' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
