import { describe, expect, it, beforeEach, vi } from 'vitest'

/**
 * Regression guard for the Weekly Signals jurisdiction scope.
 *
 * `fetchDashboardSignals(limit, countryName)` pushes the selected jurisdiction
 * into the query and returns country rows ahead of genuinely global ones. The
 * dashboard source omitted the second argument, so it fetched a diversified
 * *global* top-30 which the mobile Command Centre then filtered client-side by
 * jurisdiction.
 *
 * Measured against production on 2026-09-08: 139 countries hold eligible
 * reviewed signals, but the newest-300 window the feed reads is 64% United
 * States and Canada. Almost every other jurisdiction rendered "No reviewed
 * signals for this context" while its rows sat in the table.
 *
 * The sibling `dailyDigest` source has always passed the country through. This
 * asserts the two agree, so the argument cannot be dropped again silently.
 */

const fetchDashboardSignals = vi.fn(async () => [])
const fetchDailyDigest = vi.fn(async () => ({ signals: [], window: 'recent' as const }))
const getWantedRequestsCount = vi.fn(async () => 0)

vi.mock('@/lib/dashboard/dashboardServerData', () => ({
  fetchDashboardSignals: (...args: unknown[]) => fetchDashboardSignals(...(args as [])),
  fetchDailyDigest: (...args: unknown[]) => fetchDailyDigest(...(args as [])),
  getWantedRequestsCount: () => getWantedRequestsCount(),
}))

const { buildDashboardCommandSources } = await import('@/lib/dashboard/buildDashboardCommandSources')

function sourcesFor(countryIso2: string | null) {
  return buildDashboardCommandSources({
    countryIso2,
    roleId: 'exporter',
    userId: null,
    page: 'signals',
    hasOrganization: false,
  })
}

describe('dashboard signals source jurisdiction scope', () => {
  beforeEach(() => {
    fetchDashboardSignals.mockClear()
    fetchDailyDigest.mockClear()
  })

  it('passes the selected jurisdiction display name into the signals query', async () => {
    await sourcesFor('BW').signals.load()

    expect(fetchDashboardSignals).toHaveBeenCalledTimes(1)
    expect(fetchDashboardSignals.mock.calls[0]).toEqual([30, 'Botswana'])
  })

  it('resolves the same country label the daily digest source uses', async () => {
    const sources = sourcesFor('DE')
    await sources.signals.load()
    await sources.dailyDigest.load()

    const signalsCountry = fetchDashboardSignals.mock.calls[0][1]
    const digestCountry = fetchDailyDigest.mock.calls[0][1]

    expect(signalsCountry).toBe(digestCountry)
    expect(signalsCountry).toBe('Germany')
  })

  it('falls back to the global feed when no jurisdiction is selected', async () => {
    await sourcesFor(null).signals.load()

    expect(fetchDashboardSignals.mock.calls[0][1]).toBeUndefined()
  })
})
