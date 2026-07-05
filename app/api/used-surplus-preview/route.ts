// app/api/used-surplus-preview/route.ts
// Development preview endpoint — returns mock ScrapeRunResult summary for used-surplus sources.
// Not a production ingestion endpoint. Ported from harbourview (secondary repo) during
// consolidation — audit ref: hv/security-test-gate.

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { getMockUsedSurplusFeed } from '@/lib/scrapers/mock-used-surplus-feed'
import type { ScrapeRunResult } from '@/lib/scrapers/types'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 25
const VALID_STATUSES = ['all', 'ok', 'skipped', 'failed', 'rate_limited'] as const

type FilterStatus = (typeof VALID_STATUSES)[number]

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

function parseStatus(statusParam: string | null): FilterStatus | NextResponse {
  const normalized = (statusParam?.trim().toLowerCase() ?? 'all') as FilterStatus
  if (!VALID_STATUSES.includes(normalized)) {
    return jsonError(`Invalid status. Use one of: ${VALID_STATUSES.join(', ')}.`)
  }
  return normalized
}

function toSourceDto(entry: ScrapeRunResult) {
  return {
    source: {
      id: entry.source.id,
      name: entry.source.name,
      status: entry.source.status,
      cadenceHours: entry.source.cadenceHours,
    },
    status: entry.status,
    candidatesFound: entry.candidatesFound,
    candidatesInserted: entry.candidatesInserted,
    candidatesSkipped: entry.candidatesSkipped,
    durationMs: entry.durationMs,
    ...(entry.error ? { error: entry.error } : {}),
  }
}

export async function GET(request: NextRequest) {
  const authFailure = await requireAdminApiAuth(request)
  if (authFailure) return authFailure

  const searchParams = request.nextUrl.searchParams

  const parsedStatus = parseStatus(searchParams.get('status'))
  if (parsedStatus instanceof NextResponse) return parsedStatus

  const parsedLimit = parseLimit(searchParams.get('limit'))
  if (parsedLimit instanceof NextResponse) return parsedLimit

  const feed = await getMockUsedSurplusFeed()

  const filteredFeed: ScrapeRunResult[] =
    parsedStatus !== 'all' ? feed.filter((entry) => entry.status === parsedStatus) : feed

  const truncatedFeed = filteredFeed.slice(0, parsedLimit)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    totalSources: feed.length,
    totalMatchingSources: filteredFeed.length,
    returnedSources: truncatedFeed.length,
    filters: { status: parsedStatus, limit: parsedLimit, includeCandidates: false },
    sources: truncatedFeed.map(toSourceDto),
  })
}
