import { describe, expect, it } from 'vitest'
import { getRequiredCommandCentreSourceKeys } from '@/lib/dashboard/commandCentreSourcePlan'
import { ORIENTATION_SUPPLY_CATALOG } from '@/lib/marketplace/orientationSupplyCatalog'
import { MARKET_TABS } from '@/components/dashboard/mobile-command/contracts'

/**
 * Regression guard for "no products rendering in the market".
 *
 * Both Command Centre shells switch to the Market surface from CLIENT state and
 * render it with whatever props the server already sent — desktop
 * `handlePageChange` calls `setActivePage(page)`, mobile `navigateToSection`
 * sets `pendingSection`. Neither waits for the `router.replace` round trip. So
 * if the server did not fetch `marketplaceRows` for the page in the URL, Market
 * renders from the empty `{ rows: {} }` fallback and every tab shows "No
 * reviewed records in this category yet".
 *
 * A bare `/dashboard` has no `?page=`; `normalizeCommandPage` returns null and
 * the plan resolves null to `briefing`. Before this guard, `briefing` omitted
 * `marketplaceRows`, so the default dashboard load rendered an empty Market with
 * no error logged anywhere — an honest empty is not a source failure.
 */
describe('marketplace source availability', () => {
  it('requests marketplaceRows on the default (null) page', () => {
    expect(getRequiredCommandCentreSourceKeys(null).has('marketplaceRows')).toBe(true)
  })

  it('requests marketplaceRows on every page that can render Market from client state', () => {
    // null and 'briefing' are the two the shells can be sitting on when a user
    // clicks through to Market without a server round trip completing first.
    for (const page of [null, 'briefing', 'marketplace'] as const) {
      const keys = getRequiredCommandCentreSourceKeys(page as never)
      expect(keys.has('marketplaceRows'), `page=${page} must request marketplaceRows`).toBe(true)
      expect(keys.has('wantedCount'), `page=${page} must request wantedCount`).toBe(true)
    }
  })

  it('keeps the orientation catalog covering every MarketView, so a fetched source is never empty', () => {
    // getListingsBySections falls back to ORIENTATION_SUPPLY_CATALOG when both
    // the country-scoped and unfiltered queries return nothing. That fallback is
    // what makes "Market is empty" diagnostic: it can only mean the source was
    // never requested. If a MarketView loses catalog coverage that inference
    // silently stops holding, so pin it here.
    const covered = new Set(ORIENTATION_SUPPLY_CATALOG.map(row => row.category))
    for (const tab of MARKET_TABS) {
      // 'new-products' is spelled new_products in catalog rows; normalise.
      const key = tab.id.replace(/-/g, '_')
      expect(covered.has(key), `MarketView ${tab.id} has no orientation coverage`).toBe(true)
    }
  })
})
