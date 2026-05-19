import { NextRequest, NextResponse } from 'next/server'
import { getMockUsedSurplusFeed } from '@/lib/scrapers/mock-used-surplus-feed'
import type { ScrapeResult, ScrapedListingCandidate } from '@/lib/scrapers/types'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 25
const VALID_STATUSES = ['all', 'skipped', 'fetched', 'failed'] as const

type PreviewStatus = ScrapeResult['status']

type CandidatePreviewDto = Pick<
  ScrapedListingCandidate,
  'title' | 'description' | 'price' | 'currency' | 'location' | 'condition' | 'imageUrl' | 'tags' | 'discoveredAt'
>

function jsonError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function parseLimit(limitParam: string | null): number | NextResponse {
  if (limitParam === null) return DEFAULT_LIMIT
  if (!/^\d+$/.test(limitParam)) {
    return jsonError(`Invalid limit. Use an integer between 1 and ${MAX_LIMIT}.`)
  }

  const parsed = Number(limitParam)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    return jsonError(`Invalid limit. Use an integer between 1 and ${MAX_LIMIT}.`)
  }

  return parsed
}

function parseStatus(statusParam: string | null): 'all' | PreviewStatus | NextResponse {
  const normalized = statusParam?.trim().toLowerCase() ?? 'all'
  if (!VALID_STATUSES.includes(normalized as (typeof VALID_STATUSES)[number])) {
    return jsonError(`Invalid status. Use one of: ${VALID_STATUSES.join(', ')}.`)
  }
  return normalized as 'all' | PreviewStatus
}

function toCandidatePreviewDto(candidate: ScrapedListingCandidate): CandidatePreviewDto {
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
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const includeCandidates = searchParams.get('includeCandidates') === 'true'

  const parsedStatus = parseStatus(searchParams.get('status'))
  if (parsedStatus instanceof NextResponse) return parsedStatus

  const parsedLimit = parseLimit(searchParams.get('limit'))
  if (parsedLimit instanceof NextResponse) return parsedLimit

  const feed = await getMockUsedSurplusFeed()

  const filteredFeed =
    parsedStatus !== 'all' ? feed.filter((entry) => entry.status === parsedStatus) : feed

  const truncatedFeed = filteredFeed.slice(0, parsedLimit)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    totalSources: filteredFeed.length,
    returnedSources: truncatedFeed.length,
    filters: {
      status: parsedStatus,
      includeCandidates,
      limit: parsedLimit,
    },
    sources: truncatedFeed.map((entry) => ({
      source: {
        id: entry.source.id,
        status: entry.source.status,
        cadenceHours: entry.source.cadenceHours,
      },
      status: entry.status,
      candidateCount: entry.candidates.length,
      ...(includeCandidates
        ? {
            candidates: entry.candidates.map(toCandidatePreviewDto),
          }
        : {}),
    })),
  })
}
