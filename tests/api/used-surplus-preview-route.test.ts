import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/used-surplus-preview/route'

const forbiddenLeakageTokens = [
  'sourceUrl',
  'sourceName',
  'provenance',
  'evidence',
  'internal_notes',
  'raw_candidate',
  'raw_scraped_text',
  'contactEmail',
]

async function getPayload(url: string) {
  const response = await GET(new NextRequest(url))
  return {
    status: response.status,
    payload: await response.json(),
  }
}

describe('GET /api/used-surplus-preview', () => {
  it('returns default response with metadata and bounded truncation defaults', async () => {
    const { status, payload } = await getPayload('http://localhost/api/used-surplus-preview')

    expect(status).toBe(200)
    expect(payload.filters).toEqual({ status: 'all', includeCandidates: false, limit: 25 })
    expect(payload.returnedSources).toBe(payload.sources.length)
    expect(payload.totalSources).toBeGreaterThanOrEqual(payload.returnedSources)
    expect(payload.sources[0]).not.toHaveProperty('candidates')
  })

  it('applies a valid status filter', async () => {
    const { status, payload } = await getPayload('http://localhost/api/used-surplus-preview?status=fetched')

    expect(status).toBe(200)
    expect(payload.filters.status).toBe('fetched')
    expect(payload.sources.length).toBeGreaterThan(0)
    expect(payload.sources.every((entry: { status: string }) => entry.status === 'fetched')).toBe(true)
  })

  it('rejects invalid status values', async () => {
    const { status, payload } = await getPayload('http://localhost/api/used-surplus-preview?status=pending')

    expect(status).toBe(400)
    expect(payload.error).toContain('Invalid status')
  })

  it('applies a valid limit value', async () => {
    const { status, payload } = await getPayload('http://localhost/api/used-surplus-preview?limit=1')

    expect(status).toBe(200)
    expect(payload.filters.limit).toBe(1)
    expect(payload.returnedSources).toBeLessThanOrEqual(1)
  })

  it('rejects invalid limit values', async () => {
    const invalidLimits = ['0', '-1', '101', '1.5', 'abc']

    for (const limit of invalidLimits) {
      const { status, payload } = await getPayload(`http://localhost/api/used-surplus-preview?limit=${limit}`)
      expect(status).toBe(400)
      expect(payload.error).toContain('Invalid limit')
    }
  })

  it('does not include candidates by default or when includeCandidates=false', async () => {
    const defaultResponse = await getPayload('http://localhost/api/used-surplus-preview')
    const explicitFalse = await getPayload('http://localhost/api/used-surplus-preview?includeCandidates=false')

    expect(defaultResponse.payload.sources.every((entry: Record<string, unknown>) => !('candidates' in entry))).toBe(true)
    expect(explicitFalse.payload.sources.every((entry: Record<string, unknown>) => !('candidates' in entry))).toBe(true)
  })

  it('includes DTO-safe candidates when includeCandidates=true', async () => {
    const { status, payload } = await getPayload('http://localhost/api/used-surplus-preview?includeCandidates=true')

    expect(status).toBe(200)
    const body = JSON.stringify(payload)
    for (const token of forbiddenLeakageTokens) {
      expect(body).not.toContain(token)
    }

    const firstWithCandidates = payload.sources.find((entry: { candidates?: unknown[] }) => Array.isArray(entry.candidates))
    if (firstWithCandidates && firstWithCandidates.candidates && firstWithCandidates.candidates.length > 0) {
      expect(firstWithCandidates.candidates[0]).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String),
          tags: expect.any(Array),
          discoveredAt: expect.any(String),
        }),
      )
      expect(firstWithCandidates.candidates[0]).not.toHaveProperty('sourceUrl')
      expect(firstWithCandidates.candidates[0]).not.toHaveProperty('sourceName')
      expect(firstWithCandidates.candidates[0]).not.toHaveProperty('sourceId')
    }
  })

  it('keeps response metadata internally consistent', async () => {
    const { payload } = await getPayload('http://localhost/api/used-surplus-preview?status=skipped&limit=10')

    expect(payload.filters).toEqual({ status: 'skipped', includeCandidates: false, limit: 10 })
    expect(payload.totalSources).toBeGreaterThanOrEqual(payload.returnedSources)
    expect(payload.returnedSources).toBe(payload.sources.length)
    expect(payload.sources.every((entry: { status: string }) => entry.status === 'skipped')).toBe(true)
  })
})
