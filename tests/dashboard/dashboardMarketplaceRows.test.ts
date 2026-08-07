import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { PublicListing } from '@/lib/server/listingsQuery'

// Only the listings query is mocked. Everything else in
// buildDashboardCommandSources is left real so the wiring under test is the
// wiring that ships.
const getListingsBySections = vi.fn()

vi.mock('@/lib/server/listingsQuery', () => ({
  getListingsBySections: (...args: unknown[]) => getListingsBySections(...args),
}))

const { buildDashboardCommandSources } = await import('@/lib/dashboard/buildDashboardCommandSources')

function listing(section: string, id: string): PublicListing {
  return {
    id,
    slug: id,
    title: `${section} ${id}`,
    description: 'description',
    category: section,
    subcategory: null,
    marketplace_section: section,
    product_type: null,
    region: 'north_america',
    condition: null,
    location_country: 'CA',
    location_region: null,
    price_amount: null,
    price_currency: 'CAD',
    price_display: null,
    seller_type: 'verified_seller',
    is_featured: false,
    high_level_specs: {},
    created_at: '2026-08-01T00:00:00Z',
    average_rating: null,
    review_count: null,
  }
}

function loadRows(countryIso2: string | null = 'CA') {
  const sources = buildDashboardCommandSources({
    countryIso2,
    roleId: 'exporter',
    userId: null,
    page: 'marketplace',
  })
  return sources.marketplaceRows.load()
}

describe('Command Centre marketplace projection', () => {
  beforeEach(() => {
    getListingsBySections.mockReset()
  })

  it('queries each view separately so a busy section cannot starve a quiet one', async () => {
    // Reproduces the production defect: consumables and packaging held the
    // newest rows and consumed an entire shared budget, leaving wanted,
    // opportunities and cannabis empty while their rows sat in the database.
    getListingsBySections.mockImplementation(async (sections: string[]) => {
      if (sections.includes('consumables')) {
        return Array.from({ length: 8 }, (_, i) => listing('consumables', `c${i}`))
      }
      if (sections.includes('wanted_requests')) return [listing('wanted_requests', 'w1')]
      if (sections.includes('cannabis_inventory')) return [listing('cannabis_inventory', 'k1')]
      return []
    })

    const rows = await loadRows()

    expect(rows.consumables).toHaveLength(8)
    // Both of these were 0 before the fix.
    expect(rows.wanted).toHaveLength(1)
    expect(rows.cannabis).toHaveLength(1)
  })

  it('caps each view at its own budget rather than a shared one', async () => {
    getListingsBySections.mockImplementation(async (_sections, _country, limit: number) =>
      Array.from({ length: limit }, (_, i) => listing('consumables', `c${i}`)),
    )

    await loadRows()

    for (const call of getListingsBySections.mock.calls) {
      expect(call[2]).toBe(8)
    }
  })

  it('routes the live `processing` section to equipment, not cannabis', async () => {
    // `processing` is a real section with rows in production. The map only
    // listed `processing_equipment`, which nothing writes, so these rows were
    // unreachable — and the unmatched-section fallback would have filed them
    // under cannabis.
    const equipmentCall = getListingsBySections.mockImplementation(async (sections: string[]) =>
      sections.includes('processing') ? [listing('processing', 'p1')] : [],
    )

    const rows = await loadRows()

    expect(rows.equipment).toHaveLength(1)
    expect(rows.cannabis).toBeUndefined()

    const sectionsQueriedForEquipment = equipmentCall.mock.calls
      .map(call => call[0] as string[])
      .find(sections => sections.includes('equipment'))
    expect(sectionsQueriedForEquipment).toContain('processing')
  })

  it('passes the active country through to every view query', async () => {
    getListingsBySections.mockResolvedValue([])

    await loadRows('DE')

    expect(getListingsBySections).toHaveBeenCalled()
    for (const call of getListingsBySections.mock.calls) {
      expect(call[1]).toBe('DE')
    }
  })

  it('omits views that have no rows instead of emitting empty buckets', async () => {
    getListingsBySections.mockResolvedValue([])

    const rows = await loadRows()

    expect(Object.keys(rows)).toHaveLength(0)
  })
})
