import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarketRow } from '@/components/dashboard/CommandCentre'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import {
  MARKET_TABS,
  PAGE_TO_SECTION,
  PRIMARY_NAV,
  SECTION_GROUPS,
  SECTION_NAV,
  SECTION_TO_DESKTOP_PAGE,
  SECTION_TO_GROUP,
  SUPPLY_TABS,
  clampPercent,
  confidenceFractionToPercent,
  defaultListingTypeForView,
  matchesQuery,
  normalizeListing,
  parseMobileCommandTool,
  type PrimarySectionId,
} from '@/components/dashboard/mobile-command/contracts'

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: { value: 'country=CA&role=exporter' },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(navigation.search.value),
}))

vi.mock('@/components/marketplace/DynamicMarketplaceIntakeForm', () => ({
  DynamicMarketplaceIntakeForm: () => null,
}))

vi.mock('@/app/marketplace/financing/FinancingInquiryForm', () => ({
  default: () => null,
}))

import MobileCommandCentreRebuild from '@/components/dashboard/MobileCommandCentreRebuild'

const supplyListing: MarketRow = [
  'Bulk flower lot',
  'Reviewed supply record',
  'Canada',
  'Cannabis',
  'approved',
  'Harbourview mediated',
  '78',
  'listing-1',
  '',
  '',
]

const opportunityListing: MarketRow = [
  'EU-GMP export requirement',
  'Reviewed buyer-led commercial opportunity',
  'Germany',
  'Business opportunity',
  'approved',
  'Harbourview mediated',
  '82',
  'opportunity-1',
  '',
  '',
]

function mobileProps(overrides: Partial<MobileCommandCentreProps> = {}): MobileCommandCentreProps {
  return {
    signals: [{
      id: 'signal-1',
      title: 'German import requirements updated',
      market: 'Germany',
      type: 'Regulatory',
      commercialImpact: 'Review export pathway implications.',
    }] as unknown as MobileCommandCentreProps['signals'],
    eduCategories: [],
    initialCountryIso2: 'CA',
    initialRoleId: 'exporter',
    marketplaceRows: {
      cannabis: [supplyListing],
      opportunities: [opportunityListing],
    },
    wantedCount: 1,
    pipeline: {
      wanted: 1,
      matched: 0,
      proof_review: 1,
      inquiry: 1,
      deal_room: 0,
    },
    countryIntel: {
      public_summary: 'Canada operating context with active export and market-access considerations.',
      review_status: 'approved',
    } as MobileCommandCentreProps['countryIntel'],
    hasOrg: true,
    ...overrides,
  }
}

function renderMobileCommand(overrides: Partial<MobileCommandCentreProps> = {}) {
  const markup = renderToStaticMarkup(createElement(MobileCommandCentreRebuild, mobileProps(overrides)))
  return parseHTML(`<!doctype html><html><body>${markup}</body></html>`).document
}

beforeEach(() => {
  navigation.push.mockReset()
  navigation.replace.mockReset()
  navigation.search.value = 'country=CA&role=exporter'
})

describe('Mobile Command Centre operator architecture', () => {
  it('defines exactly the approved four primary platform modes', () => {
    expect(PRIMARY_NAV.map(item => item.label)).toEqual(['Command', 'Market', 'Intel', 'Actions'])
    expect(PRIMARY_NAV.map(item => item.id)).toEqual(['overview', 'marketplace', 'weekly-signals', 'next-actions'])
    expect(PRIMARY_NAV.some(item => item.label === 'Clinical')).toBe(false)
    expect(PRIMARY_NAV.some(item => item.label === 'Context')).toBe(false)
  })

  it('keeps every section mapped exactly once with operational domains owned by Command', () => {
    const grouped = Object.values(SECTION_GROUPS).flat()
    const sectionIds = SECTION_NAV.map(section => section.id)

    expect(grouped).toHaveLength(sectionIds.length)
    expect(new Set(grouped).size).toBe(grouped.length)
    expect([...grouped].sort()).toEqual([...sectionIds].sort())
    expect(SECTION_TO_GROUP.clinical).toBe('overview')
    expect(SECTION_TO_DESKTOP_PAGE.clinical).toBe('clinical')
    expect(PAGE_TO_SECTION.clinical).toBe('clinical')

    for (const section of [
      'jurisdiction',
      'compliance',
      'education',
      'genetics',
      'talent',
      'directories',
      'network',
      'clinical',
    ] as const) {
      expect(SECTION_TO_GROUP[section]).toBe('overview')
    }

    for (const destination of PRIMARY_NAV) {
      expect(SECTION_GROUPS[destination.id as PrimarySectionId]).toBeDefined()
      expect(SECTION_TO_GROUP[destination.id]).toBe(destination.id)
    }
  })

  it('renders an operator-first populated Command without hero or module catalogue', () => {
    const document = renderMobileCommand()
    const text = document.body.textContent || ''

    expect(document.querySelector('[data-mobile-command-version="2"]')).not.toBeNull()
    expect(document.querySelector('[data-active-destination="overview"]')).not.toBeNull()
    expect(document.querySelector('.hvm-op-page-title')?.textContent).toBe('Command')
    expect(document.querySelector('.hvm-op-context-trigger')?.textContent).toContain('Canada')
    expect(document.querySelector('.hvm-op-context-trigger')?.getAttribute('aria-label')).toContain('Change operating context')
    expect(document.querySelector('.hvm-op-pulse')).not.toBeNull()
    expect(document.querySelector('#hvm-op-attention-heading')?.textContent).toBe('Requires attention')
    expect(document.querySelector('#hvm-op-changes-heading')?.textContent).toBe('Recent intelligence')
    expect(document.querySelector('#hvm-op-opportunity-heading')?.textContent).toBe('Commercial opportunity')
    expect(document.querySelector('#hvm-op-picture-heading')?.textContent).toBe('Canada')

    expect(text).not.toContain('Operator command centre')
    expect(text).not.toContain('All Command Centre modules')
    expect(text).not.toContain('32 available')
    expect(document.querySelector('[data-command-module]')).toBeNull()
    expect(document.querySelector('.hvm2-section-rail')).toBeNull()
    expect(document.querySelector('.hvm-op-secondary-nav')?.getAttribute('aria-label')).toBe('Command domains and operating controls')
  })

  it('uses existing action, signal and opportunity data for Command pulse and populated previews', () => {
    const document = renderMobileCommand()
    const pulse = [...document.querySelectorAll('.hvm-op-pulse strong')].map(node => node.textContent)

    expect(pulse).toEqual(['3', '1', '1'])
    expect(document.body.textContent).toContain('Review 1 active inquiry')
    expect(document.body.textContent).toContain('German import requirements updated')
    expect(document.body.textContent).toContain('EU-GMP export requirement')
    expect(document.querySelectorAll('.hvm-op-compact-zero')).toHaveLength(0)
  })

  it('compresses only empty intelligence and opportunity categories into tappable zero rows', () => {
    const document = renderMobileCommand({
      signals: [] as unknown as MobileCommandCentreProps['signals'],
      marketplaceRows: {
        cannabis: [supplyListing],
        opportunities: [],
      },
    })
    const zeroRows = [...document.querySelectorAll('.hvm-op-compact-zero')]
    const text = document.body.textContent || ''

    expect(zeroRows).toHaveLength(2)
    expect(zeroRows.every(row => row.tagName.toLowerCase() === 'button')).toBe(true)
    expect(text).toContain('Recent intelligence')
    expect(text).toContain('No material updates in this context')
    expect(text).toContain('Commercial opportunities')
    expect(text).toContain('No matching opportunities currently')
    expect(text).not.toContain('No material intelligence loaded')
    expect(text).not.toContain('No qualified opportunities loaded')
    expect(document.querySelector('#hvm-op-changes-heading')).toBeNull()
    expect(document.querySelector('#hvm-op-opportunity-heading')).toBeNull()
    expect(document.querySelector('#hvm-op-attention-heading')?.textContent).toBe('Requires attention')
    expect(document.querySelector('#hvm-op-picture-heading')?.textContent).toBe('Canada')
  })

  it('keeps exactly one committed section mounted', () => {
    const document = renderMobileCommand()
    expect([...document.querySelectorAll('.hvm-op-main > section')].map(node => node.id)).toEqual(['overview'])

    navigation.search.value = 'country=CA&role=exporter&section=marketplace'
    const marketDocument = renderMobileCommand({ initialPage: 'marketplace' })
    expect([...marketDocument.querySelectorAll('.hvm-op-main > section')].map(node => node.id)).toEqual(['marketplace'])
  })

  it('keeps scoped secondary reachability on the Command landing and other destinations', () => {
    navigation.search.value = 'country=CA&role=exporter&section=marketplace'
    const document = renderMobileCommand({ initialPage: 'marketplace' })
    const rail = [...document.querySelectorAll('.hvm-op-secondary-nav button')]

    expect(rail).toHaveLength(SECTION_GROUPS.marketplace.length)
    expect(rail.map(button => button.textContent)).toContain('Marketplace control')
    expect(document.querySelector('.hvm2-section-rail')).toBeNull()

    navigation.search.value = 'country=CA&role=exporter&section=overview'
    const landing = renderMobileCommand({ initialPage: 'briefing' })
    const landingRail = [...landing.querySelectorAll('.hvm-op-secondary-nav button')]
      .map(button => button.textContent)
    expect(landingRail).toEqual(
      SECTION_GROUPS.overview.map(id => SECTION_NAV.find(entry => entry.id === id)?.label),
    )
  })

  it('offers a way back to the Command landing from the rail, and keeps the rail there', () => {
    navigation.search.value = 'country=CA&role=exporter&section=jurisdiction'
    const railed = renderMobileCommand({ initialPage: 'access-pathway' })
    const railLabels = [...railed.querySelectorAll('.hvm-op-secondary-nav button')]
      .map(button => button.textContent)

    expect(railLabels).toContain('Command')
    expect(railLabels).toHaveLength(SECTION_GROUPS.overview.length)

    navigation.search.value = 'country=CA&role=exporter&section=overview'
    const returned = renderMobileCommand({ initialPage: 'briefing' })
    expect(returned.querySelector('.hvm-op-secondary-nav')).not.toBeNull()
    expect([...returned.querySelectorAll('.hvm-op-main > section')].map(node => node.id)).toEqual(['overview'])
  })

  it('preserves a Clinical deep link while keeping Command active globally', () => {
    navigation.search.value = 'country=CA&role=exporter&section=clinical'
    const document = renderMobileCommand({ initialPage: 'clinical' })

    expect([...document.querySelectorAll('.hvm-op-main > section')].map(node => node.id)).toEqual(['clinical'])
    const current = document.querySelector('.hvm-op-bottom-nav button[aria-current="page"]')
    expect(current?.textContent).toContain('Command')
    expect([...document.querySelectorAll('.hvm-op-bottom-nav small')].map(node => node.textContent)).toEqual(['Command', 'Market', 'Intel', 'Actions'])
    expect([...document.querySelectorAll('.hvm-op-secondary-nav button')].map(node => node.textContent)).toContain('Clinical')
  })

  it('reaches the supported operational sections Command owns, and rails them once committed', () => {
    navigation.search.value = 'country=CA&role=exporter&section=jurisdiction'
    const document = renderMobileCommand({ initialPage: 'access-pathway' })

    expect([...document.querySelectorAll('.hvm-op-main > section')].map(node => node.id)).toEqual(['jurisdiction'])
    const current = document.querySelector('.hvm-op-bottom-nav button[aria-current="page"]')
    expect(current?.textContent).toContain('Command')

    const rail = [...document.querySelectorAll('.hvm-op-secondary-nav button')]
    expect(rail).toHaveLength(SECTION_GROUPS.overview.length)
    for (const label of ['Genetics', 'Talent', 'Clinical', 'Compliance', 'Education', 'Directories', 'Network']) {
      expect(rail.map(button => button.textContent)).toContain(label)
    }
  })

  it('keeps catalogue marketplace controls under Market rather than operational domains', () => {
    navigation.search.value = 'country=CA&role=exporter&section=marketplace'
    const document = renderMobileCommand({ initialPage: 'marketplace' })

    expect([...document.querySelectorAll('.hvm-op-main > section')].map(node => node.id)).toEqual(['marketplace'])
    const current = document.querySelector('.hvm-op-bottom-nav button[aria-current="page"]')
    expect(current?.textContent).toContain('Market')

    const rail = [...document.querySelectorAll('.hvm-op-secondary-nav button')].map(button => button.textContent)
    expect(rail).toEqual(
      SECTION_GROUPS.marketplace.map(id => SECTION_NAV.find(entry => entry.id === id)?.label),
    )
    for (const label of ['Genetics', 'Talent', 'Clinical', 'Directories', 'Network']) {
      expect(rail).not.toContain(label)
    }
  })
})

describe('Mobile Command Centre data contracts', () => {
  it('preserves complete marketplace and supply category universes', () => {
    expect(MARKET_TABS.map(tab => tab.id)).toEqual([
      'cannabis',
      'wanted',
      'opportunities',
      'equipment',
      'consumables',
      'services',
      'new-products',
    ])
    expect(SUPPLY_TABS.map(tab => tab.id)).toEqual([
      'cannabis',
      'equipment',
      'consumables',
      'services',
      'new-products',
    ])
  })

  it('normalizes marketplace tuples without corrupting confidence', () => {
    expect(normalizeListing(supplyListing, 0, 'cannabis', 'Global')).toEqual({
      id: 'listing-1',
      title: 'Bulk flower lot',
      summary: 'Reviewed supply record',
      jurisdiction: 'Canada',
      category: 'Cannabis',
      status: 'approved',
      channel: 'Harbourview mediated',
      confidence: 78,
      view: 'cannabis',
    })
  })

  it('keeps percentages and fractions distinct', () => {
    expect(clampPercent(1)).toBe(1)
    expect(clampPercent(101)).toBe(100)
    expect(confidenceFractionToPercent(0.72)).toBe(72)
    expect(confidenceFractionToPercent(1)).toBe(100)
  })

  it('keeps query and contained-tool helpers stable', () => {
    expect(matchesQuery('  CANADA ', ['Canada', 'Germany'])).toBe(true)
    expect(matchesQuery('', ['Anything'])).toBe(true)
    expect(matchesQuery('missing', ['Anything'])).toBe(false)
    expect(parseMobileCommandTool('wanted-intake')).toBe('wanted-intake')
    expect(parseMobileCommandTool('external-checkout')).toBeNull()
    expect(defaultListingTypeForView('equipment')).toBe('Used / Surplus Equipment')
  })
})