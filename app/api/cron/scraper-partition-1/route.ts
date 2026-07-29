// app/api/cron/scraper-partition-1/route.ts
// Scraper partition 1 of 4. Processes sources where hash(source.id) % 4 == 1.

import { NextResponse } from 'next/server'
import { runScrapeEngine } from '@/lib/scrapers/runner-v2'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  const summary = await runScrapeEngine({ partitionCount: 4, partitionIndex: 1 })
  return NextResponse.json(summary)
}
