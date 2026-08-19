import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  searchInteractionFixtures: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/fixtures/clinical/interactions', () => ({
  searchInteractionFixtures: mocks.searchInteractionFixtures,
}))

function makeQuery(result: { data: unknown[] | null; error: { message: string } | null }) {
  const query: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'order', 'limit', 'or']) {
    query[method] = vi.fn(() => query)
  }
  query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return query
}

const dbRow = {
  id: 'db-valproate-cbd',
  medication_ingredient: 'valproate',
  cannabinoid: 'CBD',
  mechanism: 'DB interaction',
  clinical_significance: 'major',
  evidence_certainty: 'moderate',
  uncertainty: null,
  monitoring_consideration: 'Monitor LFTs',
  primary_source_title: 'DB primary source',
  primary_source_url: 'https://pubmed.ncbi.nlm.nih.gov/28782097/',
  verified_at: '2026-08-18T00:00:00Z',
  review_status: 'published',
}

const fixtureRow = {
  id: 'fixture-row',
  medicationIngredient: 'fixture-medication',
  cannabinoid: 'CBD',
  mechanism: 'Fixture interaction',
  clinicalSignificance: 'moderate' as const,
  evidenceCertainty: 'low',
  uncertainty: null,
  monitoringConsideration: 'Fixture monitoring',
  primarySourceTitle: 'Fixture source',
  primarySourceUrl: 'https://example.invalid/fixture',
  verifiedAt: '2026-01-01T00:00:00Z',
}

describe('Clinical interaction DB versus fixture contract', () => {
  let searchClinicalInteractions: typeof import('@/lib/server/clinicalInteractionQuery').searchClinicalInteractions

  beforeAll(async () => {
    ;({ searchClinicalInteractions } = await import('@/lib/server/clinicalInteractionQuery'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.searchInteractionFixtures.mockReturnValue([fixtureRow])
  })

  it('uses published database rows when the DB returns data', async () => {
    const query = makeQuery({ data: [dbRow], error: null })
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) })

    const result = await searchClinicalInteractions({ q: 'valproate', limit: 12 })

    expect(result.state).toBe('loaded')
    expect(result.interactions).toHaveLength(1)
    expect(result.interactions[0]?.id).toBe('db-valproate-cbd')
    expect(result.interactions[0]?.primarySourceUrl).toBe('https://pubmed.ncbi.nlm.nih.gov/28782097/')
    expect(mocks.searchInteractionFixtures).not.toHaveBeenCalled()
  })

  it('uses fixtures only when the database query returns an error', async () => {
    const query = makeQuery({ data: null, error: { message: 'schema unavailable' } })
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) })

    const result = await searchClinicalInteractions({ q: 'fixture', limit: 12 })

    expect(result.state).toBe('loaded')
    expect(result.interactions[0]?.id).toBe('fixture-row')
    expect(mocks.searchInteractionFixtures).toHaveBeenCalledTimes(1)
  })

  it('uses fixtures when the database is healthy but has no matching rows', async () => {
    const query = makeQuery({ data: [], error: null })
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) })

    const result = await searchClinicalInteractions({ q: 'fixture', limit: 12 })

    expect(result.state).toBe('loaded')
    expect(result.interactions[0]?.id).toBe('fixture-row')
    expect(mocks.searchInteractionFixtures).toHaveBeenCalledTimes(1)
  })
})
