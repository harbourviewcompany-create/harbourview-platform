// app/api/cron/scraper-partition-0/route.ts
// Scraper partition 0 of 4. Processes sources where hash(source.id) % 4 == 0.

import { NextResponse } from 'next/server'
import { runScrapeEngine } from '@/lib/scrapers/runner-v2'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const summary = await runScrapeEngine({ partitionCount: 4, partitionIndex: 0 })
  return NextResponse.json(summary)
}
