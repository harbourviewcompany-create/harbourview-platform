import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
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
    const { response, body } = await callRoute('?status=fetched')
    expect(response.status).toBe(200)
    expect(body.filters.status).toBe('fetched')
    expect(body.totalSources).toBe(unfiltered.body.totalSources)
    expect(body.totalMatchingSources).toBeGreaterThanOrEqual(body.returnedSources)
    for (const source of body.sources) {
      expect(source.status).toBe('fetched')
    }
  })

  it('normalizes case and whitespace in valid status filters', async () => {
    const { response, body } = await callRoute('?status=%20FETCHED%20')
    expect(response.status).toBe(200)
    expect(body.filters.status).toBe('fetched')
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

  it('includes only allowlisted candidate fields when includeCandidates=true', async () => {
    const { response, body } = await callRoute('?includeCandidates=true&status=fetched&limit=1')
    expect(response.status).toBe(200)
    const candidate = body.sources[0]?.candidates?.[0]
    expect(candidate).toBeTruthy()

    const allowedKeys = [
      'title',
      'description',
      'price',
      'currency',
      'location',
      'condition',
      'imageUrl',
      'tags',
      'discoveredAt',
    ]

    for (const key of Object.keys(candidate)) {
      expect(allowedKeys).toContain(key)
    }

    expect(candidate).toHaveProperty('title')
    expect(candidate).toHaveProperty('description')
    expect(candidate).toHaveProperty('discoveredAt')
    expect(candidate).not.toHaveProperty('sourceId')
    expect(candidate).not.toHaveProperty('sourceName')
    expect(candidate).not.toHaveProperty('sourceUrl')
    expect(candidate).not.toHaveProperty('confidence')
  })
})
