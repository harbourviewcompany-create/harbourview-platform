import { describe, expect, it, vi, beforeEach } from 'vitest'

// These two readers each queried columns that do not exist on their relation.
// PostgREST rejects the request, `data` comes back null, and both functions
// returned their empty value against populated tables -- silently, because the
// surrounding code treats "no rows" and "malformed query" identically.
//
// The Supabase client is recorded rather than stubbed per-call so the assertions
// below are about the query that actually ships: which relation it targets, and
// which column names it names.

type Recorded = {
  table: string
  select: string[]
  filters: Array<[string, string, unknown]>
  orders: string[]
}

const recorded: Recorded[] = []
let nextResult: { data: unknown; count?: number; error: unknown } = { data: [], error: null }

function queryBuilder(entry: Recorded) {
  const builder: Record<string, unknown> = {}
  const chain = (fn: () => void) => (...args: unknown[]) => {
    void args
    fn()
    return builder
  }

  builder.select = (columns: string) => {
    entry.select = columns.split(',').map(column => column.trim()).filter(Boolean)
    return builder
  }
  for (const op of ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'ilike', 'in', 'not', 'or'] as const) {
    builder[op] = (column: string, ...rest: unknown[]) => {
      entry.filters.push([op, column, rest[0]])
      return builder
    }
  }
  builder.order = chain(() => {})
  builder.order = (column: string) => {
    entry.orders.push(column)
    return builder
  }
  builder.limit = chain(() => {})
  builder.maybeSingle = () => Promise.resolve(nextResult)
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(nextResult).then(resolve)
  return builder
}

const createClient = vi.fn(async () => ({
  from: (table: string) => {
    const entry: Recorded = { table, select: [], filters: [], orders: [] }
    recorded.push(entry)
    return queryBuilder(entry)
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
  createSupabaseServerClient: createClient,
  createSupabaseServiceClient: createClient,
}))

// Every column each relation actually exposes on the `api` schema PostgREST
// serves. Kept literal so a drifting query fails here rather than in a browser.
const API_COLUMNS: Record<string, string[]> = {
  education_tracks: ['id', 'slug', 'title', 'description', 'publication_state', 'created_at', 'updated_at'],
  listings: [
    'id', 'category', 'title', 'description', 'product_type', 'region', 'price_range', 'seller_type',
    'high_level_specs', 'status', 'internal_notes', 'internal_score', 'contact_name', 'contact_email',
    'contact_phone', 'legal_entity', 'created_at', 'updated_at', 'archived_at', 'superseded_by',
    'marketplace_section', 'slug', 'public_visibility', 'is_featured', 'price_amount', 'price_currency',
    'location_country', 'condition', 'brand', 'model', 'quantity', 'unit', 'private_notes',
  ],
}

function expectColumnsExist(entry: Recorded) {
  const known = API_COLUMNS[entry.table]
  expect(known, `no column fixture for ${entry.table}`).toBeDefined()
  const referenced = [
    ...entry.select,
    ...entry.filters.map(([, column]) => column),
    ...entry.orders,
  ].filter(column => column !== '*')

  for (const column of referenced) {
    expect(known).toContain(column)
  }
  return referenced
}

describe('dashboard readers only name columns their relation exposes', () => {
  beforeEach(() => {
    recorded.length = 0
    nextResult = { data: [], error: null }
  })

  it('reads education tracks by publication_state, not a status column that does not exist', async () => {
    const { getEducationTracks } = await import('@/lib/dashboard/dashboardLiveData')
    nextResult = {
      data: [{ id: 'track-1', title: 'Import readiness', description: 'Reviewed track' }],
      error: null,
    }

    const tracks = await getEducationTracks()

    const query = recorded.find(entry => entry.table === 'education_tracks')
    expect(query, 'education_tracks was never queried').toBeDefined()
    expectColumnsExist(query!)

    // The specific regression: five names that are not on this relation.
    const referenced = [...query!.select, ...query!.filters.map(([, c]) => c), ...query!.orders]
    for (const absent of ['icon', 'level', 'tags', 'status', 'sort_order']) {
      expect(referenced, absent).not.toContain(absent)
    }
    expect(query!.filters).toContainEqual(['eq', 'publication_state', 'published'])

    // Rows still map, and the columns the table cannot supply stay nullable
    // rather than being dropped from the contract its consumers rely on.
    expect(tracks).toEqual([
      { id: 'track-1', title: 'Import readiness', description: 'Reviewed track', icon: null, level: null, tags: [] },
    ])
  })

  it('counts wanted requests the same way the list beneath the count is built', async () => {
    const { getWantedRequestsCount } = await import('@/lib/dashboard/dashboardServerData')
    nextResult = { data: [], count: 8, error: null }

    await getWantedRequestsCount('CA')

    const query = recorded.find(entry => entry.table === 'listings')
    expect(query, 'listings was never queried').toBeDefined()
    expectColumnsExist(query!)

    const referenced = query!.filters.map(([, column]) => column)
    expect(referenced, 'listing_type is not a column on listings').not.toContain('listing_type')
    expect(query!.filters).toContainEqual(['eq', 'marketplace_section', 'wanted_requests'])
    // The status enum is approved/pending_review -- 'published' is not a member.
    expect(query!.filters).toContainEqual(['eq', 'status', 'approved'])
  })
})
