import { NextResponse } from 'next/server'
import { getMockUsedSurplusFeed } from '@/lib/scrapers/mock-used-surplus-feed'

export async function GET() {
  const feed = await getMockUsedSurplusFeed()

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    sources: feed.map((entry) => ({
      source: {
        id: entry.source.id,
        status: entry.source.status,
        cadenceHours: entry.source.cadenceHours,
      },
      status: entry.status,
      candidateCount: entry.candidates.length,
    })),
  })
}
