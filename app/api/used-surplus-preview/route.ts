import { NextRequest, NextResponse } from 'next/server'
import { getMockUsedSurplusFeed } from '@/lib/scrapers/mock-used-surplus-feed'
import type { ScrapedListingCandidate, ScrapeResult } from '@/lib/scrapers/types'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 25
const ALLOWED_STATUSES: ReadonlyArray<ScrapeResult['status']> = ['fetched', 'failed', 'skipped']

function parseLimit(limitParam: string | null) {
  if (limitParam === null) return { ok: true as const, value: DEFAULT_LIMIT }
  if (!/^\d+$/.test(limitParam)) {
    return { ok: false as const, error: `Invalid limit. Use an integer between 1 and ${MAX_LIMIT}.` }
  }

  const parsed = Number(limitParam)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    return { ok: false as const, error: `Invalid limit. Use an integer between 1 and ${MAX_LIMIT}.` }
  }

  return { ok: true as const, value: parsed }
}

function parseStatus(statusParam: string | null) {
  const normalized = statusParam?.trim().toLowerCase() ?? 'all'
  if (normalized === 'all') return { ok: true as const, value: 'all' as const }
  if (!ALLOWED_STATUSES.includes(normalized as ScrapeResult['status'])) {
    return { ok: false as const, error: `Invalid status. Allowed values: all, ${ALLOWED_STATUSES.join(', ')}.` }
  }
  return { ok: true as const, value: normalized as ScrapeResult['status'] }
}

function toSafeCandidateDto(candidate: ScrapedListingCandidate) {
  return {
    title: candidate.title,
    description: candidate.description,
    price: candidate.price,
    currency: candidate.currency,
    location: candidate.location,
    condition: candidate.condition,
    imageUrl: candidate.imageUrl,
    tags: candidate.tags,
    discoveredAt: candidate.discoveredAt,
    confidence: candidate.confidence,
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const includeCandidates = searchParams.get('includeCandidates') === 'true'

  const statusResult = parseStatus(searchParams.get('status'))
  if (!statusResult.ok) {
    return NextResponse.json({ error: statusResult.error }, { status: 400 })
  }

  const limitResult = parseLimit(searchParams.get('limit'))
  if (!limitResult.ok) {
    return NextResponse.json({ error: limitResult.error }, { status: 400 })
  }

  const feed = await getMockUsedSurplusFeed()
  const filteredFeed =
    statusResult.value === 'all'
      ? feed
      : feed.filter((entry) => entry.status === statusResult.value)

  const boundedFeed = filteredFeed.slice(0, limitResult.value)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    totalSources: filteredFeed.length,
    returnedSources: boundedFeed.length,
    filters: {
      status: statusResult.value,
      includeCandidates,
      limit: limitResult.value,
    },
    sources: boundedFeed.map((entry) => ({
      source: {
        id: entry.source.id,
        status: entry.source.status,
        cadenceHours: entry.source.cadenceHours,
      },
      status: entry.status,
      candidateCount: entry.candidates.length,
      ...(includeCandidates
        ? {
            candidates: entry.candidates.map(toSafeCandidateDto),
          }
        : {}),
    })),
  })
}
