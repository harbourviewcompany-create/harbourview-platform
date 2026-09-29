import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  auth: vi.fn(),
  routes: vi.fn(),
  tier: vi.fn(),
  load: vi.fn(),
}))
vi.mock('@/components/dashboard/DashboardResponsiveShell', () => ({ default: () => null }))
vi.mock('@/components/dashboard/CommandCentreDataBoundary', () => ({ default: () => null }))
vi.mock('@/lib/dashboard/dashboardShared', () => ({ ROLE_PROFILES: {} }))
vi.mock('@/lib/dashboard/dashboardServerData', () => ({ getEduCategoriesForRole: () => [] }))
vi.mock('@/lib/dashboard/buildDashboardCommandSources', () => ({ buildDashboardCommandSources: () => ({}) }))
vi.mock('@/lib/dashboard/activeWorkspaceDashboardData', () => ({
  getActiveEvidenceData: vi.fn(), getActiveOrgPathwayProgress: vi.fn(), getActiveWatchlistData: vi.fn(),
}))
vi.mock('@/lib/dashboard/pathwayReadiness', () => ({ mergePathwayData: vi.fn(), deriveRequirementStatusesFromIntel: vi.fn() }))
vi.mock('@/lib/billing/entitlements', () => ({ canAccess: () => false, checkFeatureAccess: () => false, normalizeSubscriptionTier: (v: string) => v }))
vi.mock('@/lib/stripe/tier', () => ({ getUserTier: mocks.tier }))
vi.mock('@/lib/intelligence-os/dashboardRoutes', () => ({ attachDecisionIntelDashboardRoutes: mocks.routes }))
vi.mock('@/lib/dashboard/loadCommandCentreData', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/dashboard/loadCommandCentreData')>(),
  loadCommandCentreData: mocks.load,
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mocks.auth },
  from: (table: string) => {
    const query = { select: () => query, eq: () => query, maybeSingle: () => mocks.read(table) }
    return query
  },
}) }))

import DashboardPage from '@/app/dashboard/page'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.resetAllMocks() })

function setup() {
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.auth.mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null })
  mocks.routes.mockImplementation(async (value: unknown) => value)
  mocks.tier.mockResolvedValue('free')
  mocks.load.mockResolvedValue({
    state: 'live', sources: { marketplaceRows: { requested: false, errorCode: null } },
    data: { liveEduTiles: [], signals: [], dailyDigest: { signals: [], window: null }, marketplaceRows: { rows: [], mediaById: {} } },
  })
}

describe('dashboard optional context outages', () => {
  it('renders the selected market when preferences never settle', async () => {
    setup()
    mocks.read.mockImplementation(() => new Promise(() => {}))
    let rendered = false
    const pending = DashboardPage({ searchParams: Promise.resolve({ country: 'DE', page: 'briefing' }) })
      .then(page => { rendered = true; return page })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(rendered).toBe(true)
    await pending
    expect(mocks.load.mock.calls[0][0]).toMatchObject({ countryIso2: 'DE', userId: 'test-user', hasOrganization: false })
  })

  it('fails closed on a stalled workspace membership read', async () => {
    setup()
    mocks.read.mockImplementation((table: string) => table === 'user_dashboard_preferences'
      ? Promise.resolve({ data: { active_workspace_id: 'test-workspace' } })
      : new Promise(() => {}))
    let rendered = false
    const pending = DashboardPage({ searchParams: Promise.resolve({ country: 'DE' }) })
      .then(page => { rendered = true; return page })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(rendered).toBe(true)
    await pending
    expect(mocks.load.mock.calls[0][0]).toMatchObject({ hasOrganization: false })
  })

  it('retains a verified workspace on successful reads', async () => {
    setup()
    mocks.read.mockImplementation((table: string) => Promise.resolve({ data:
      table === 'user_dashboard_preferences' ? { active_workspace_id: 'test-workspace', country_iso2: 'CA' }
      : table === 'workspace_members' ? { workspace_id: 'test-workspace' }
      : { id: 'test-workspace', status: 'active' },
    }))
    await DashboardPage({ searchParams: Promise.resolve({ country: 'DE' }) })
    expect(mocks.load.mock.calls[0][0]).toMatchObject({ countryIso2: 'DE', hasOrganization: true })
  })

  it('renders with free access when the tier lookup stalls', async () => {
    setup()
    mocks.read.mockResolvedValue({ data: null })
    mocks.tier.mockImplementation(() => new Promise(() => {}))
    let rendered = false
    const pending = DashboardPage({ searchParams: Promise.resolve({ country: 'DE' }) })
      .then(page => { rendered = true; return page })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(rendered).toBe(true)
    const page = await pending
    expect(page.props.children.props.userTier).toBe('free')
  })

  it('fails closed when the page authentication check stalls', async () => {
    setup()
    mocks.auth.mockImplementation(() => new Promise(() => {}))
    let outcome = 'pending'
    const pending = DashboardPage({ searchParams: Promise.resolve({ country: 'DE' }) })
      .then(() => { outcome = 'rendered' }, () => { outcome = 'rejected' })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(outcome).toBe('rejected')
    await pending
    expect(mocks.read).not.toHaveBeenCalled()
    expect(mocks.load).not.toHaveBeenCalled()
  })

  it('does not load dashboard data when the page cannot verify a user', async () => {
    setup()
    mocks.auth.mockResolvedValue({ data: { user: null }, error: new Error('Auth unavailable') })
    await expect(DashboardPage({ searchParams: Promise.resolve({ country: 'DE' }) })).rejects.toThrow()
    expect(mocks.load).not.toHaveBeenCalled()
  })

  it('preserves signal content but suppresses unverified dossier routes after a stall', async () => {
    setup()
    mocks.read.mockResolvedValue({ data: null })
    mocks.routes.mockImplementation(() => new Promise(() => {}))
    const signal = { id: 'test-signal', title: 'Reviewed headline', decisionIntelEventId: 'stale-event', decisionRecommendationState: 'act_now' }
    const bundle = await mocks.load()
    bundle.data.signals = [signal]
    bundle.data.dailyDigest.signals = [signal]
    mocks.load.mockResolvedValue(bundle)
    let rendered = false
    const pending = DashboardPage({ searchParams: Promise.resolve({ country: 'DE' }) })
      .then(page => { rendered = true; return page })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(rendered).toBe(true)
    const page = await pending
    for (const values of [page.props.children.props.signals, page.props.children.props.digestSignals]) {
      expect(values).toEqual([{ ...signal, decisionIntelEventId: undefined, decisionRecommendationState: undefined }])
    }
    expect(signal.decisionIntelEventId).toBe('stale-event')
  })

})
