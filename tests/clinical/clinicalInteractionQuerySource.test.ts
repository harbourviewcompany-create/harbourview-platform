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
  source_locator: 'PMID 28782097',
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
  primarySourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28782097/',
  verifiedAt: '2026-01-01T00:00:00Z',
}

describe('Clinical interaction DB versus fixture contract', () => {
  let searchClinicalInteractions: typeof import('@/lib/server/clinicalInteractionQuery').searchClinicalInteractions

  beforeAll(async () => {
    ;({ searchClinicalInteractions } = await import('@/lib/server/clinicalInteractionQuery'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.HARBOURVIEW_CLINICAL_FIXTURES
    mocks.searchInteractionFixtures.mockReturnValue([fixtureRow])
  })

  it('uses published inspectable database rows when the DB returns governed data', async () => {
    const query = makeQuery({ data: [dbRow], error: null })
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) })

    const result = await searchClinicalInteractions({ q: 'valproate', limit: 12 })

    expect(result.state).toBe('loaded')
    expect(result.interactions).toHaveLength(1)
    expect(result.interactions[0]?.id).toBe('db-valproate-cbd')
    expect(result.interactions[0]?.primarySourceUrl).toBe('https://pubmed.ncbi.nlm.nih.gov/28782097/')
    expect(result.interactions[0]?.sourceLocator).toBe('PMID 28782097')
    expect(mocks.searchInteractionFixtures).not.toHaveBeenCalled()
  })

  it('fails closed when the database query errors and fixture mode is not explicitly enabled', async () => {
    const query = makeQuery({ data: null, error: { message: 'schema unavailable' } })
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) })

    const result = await searchClinicalInteractions({ q: 'fixture', limit: 12 })

    expect(result.state).toBe('error')
    expect(result.interactions).toEqual([])
    expect(result.error).toBe('schema unavailable')
    expect(mocks.searchInteractionFixtures).not.toHaveBeenCalled()
  })

  it('returns an honest empty state when the database is healthy with no matches and fixture mode is disabled', async () => {
    const query = makeQuery({ data: [], error: null })
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) })

    const result = await searchClinicalInteractions({ q: 'fixture', limit: 12 })

    expect(result.state).toBe('empty')
    expect(result.interactions).toEqual([])
    expect(mocks.searchInteractionFixtures).not.toHaveBeenCalled()
  })
})
