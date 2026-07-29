// app/api/cron/scraper-partition-3/route.ts
// Scraper partition 3 of 4. Processes sources where hash(source.id) % 4 == 3.

import { NextResponse } from 'next/server'
import { runScrapeEngine } from '@/lib/scrapers/runner-v2'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  const summary = await runScrapeEngine({ partitionCount: 4, partitionIndex: 3 })
  return NextResponse.json(summary)
}
