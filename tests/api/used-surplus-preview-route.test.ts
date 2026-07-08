import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/adminApiAuth', () => ({
  requireAdminApiAuth: vi.fn().mockResolvedValue(null),
}))

import { GET } from '../../app/api/used-surplus-preview/route'

async function callRoute(query = '') {
  const request = new NextRequest(`http://localhost/api/used-surplus-preview${query}`)
  const response = await GET(request)
  const body = await response.json()
  return { response, body }
}

describe('GET /api/used-surplus-preview', () => {
  it('returns default response metadata and bounded truncation defaults', async () => {
    const { response, body } = await callRoute()
    expect(response.status).toBe(200)
    expect(body.filters).toMatchObject({ status: 'all', includeCandidates: false, limit: 25 })
    expect(body.returnedSources).toBeLessThanOrEqual(body.filters.limit)
    expect(body.returnedSources).toBe(body.sources.length)
    expect(body.totalSources).toBeGreaterThanOrEqual(body.returnedSources)
    expect(body.totalMatchingSources).toBe(body.totalSources)
  })

  it('filters by valid status without changing total source count', async () => {
    const unfiltered = await callRoute()
    const { response, body } = await callRoute('?status=ok')
    expect(response.status).toBe(200)
    expect(body.filters.status).toBe('ok')
    expect(body.totalSources).toBe(unfiltered.body.totalSources)
    expect(body.totalMatchingSources).toBeGreaterThanOrEqual(body.returnedSources)
    for (const source of body.sources) {
      expect(source.status).toBe('ok')
    }
  })

  it('normalizes case and whitespace in valid status filters', async () => {
    const { response, body } = await callRoute('?status=%20OK%20')
    expect(response.status).toBe(200)
    expect(body.filters.status).toBe('ok')
  })

  it('returns 400 for invalid status', async () => {
    const { response, body } = await callRoute('?status=unknown')
    expect(response.status).toBe(400)
    expect(body.error).toContain('Invalid status')
  })

  it('accepts valid limit', async () => {
    const { response, body } = await callRoute('?limit=1')
    expect(response.status).toBe(200)
    expect(body.filters.limit).toBe(1)
    expect(body.returnedSources).toBeLessThanOrEqual(1)
  })

  it.each(['0', '-1', '101', '1.5', 'abc', '', ' 1'])('rejects invalid limit: %s', async (limit) => {
    const { response, body } = await callRoute(`?limit=${encodeURIComponent(limit)}`)
    expect(response.status).toBe(400)
    expect(body.error).toContain('Invalid limit')
  })

  it('does not include candidates by default', async () => {
    const { response, body } = await callRoute()
    expect(response.status).toBe(200)
    for (const source of body.sources) {
      expect(source.candidates).toBeUndefined()
    }
  })

  it('accepts includeCandidates=true but never returns a candidates array (counts-only by design)', async () => {
    // This is a dev-only preview endpoint (see route.ts header comment) that intentionally
    // returns aggregate counts (candidatesFound/Inserted/Skipped) rather than per-source
    // candidate objects — there is no candidates array to allowlist-filter here. If a future
    // change adds real candidate payloads to ScrapeRunResult, this test should be replaced
    // with field-allowlist assertions matching ScrapedCandidate's public-safe fields.
    const { response, body } = await callRoute('?includeCandidates=true&status=ok&limit=1')
    expect(response.status).toBe(200)
    expect(body.filters.includeCandidates).toBe(false)
    for (const source of body.sources) {
      expect(source.candidates).toBeUndefined()
      expect(source).toHaveProperty('candidatesFound')
      expect(source).toHaveProperty('candidatesInserted')
      expect(source).toHaveProperty('candidatesSkipped')
    }
  })
})
