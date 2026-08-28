import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileCommandCentreRebuild } from '@/components/dashboard/MobileCommandCentreRebuild'
import {
  PAGE_TO_SECTION,
  PRIMARY_NAV,
  SECTION_GROUPS,
  SECTION_NAV,
  SECTION_TO_DESKTOP_PAGE,
  SECTION_TO_GROUP,
  type PrimarySectionId,
} from '@/components/dashboard/mobile-command/contracts'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import type { MarketRow } from '@/components/dashboard/CommandCentre'
import { defaultListingTypeForView, parseMobileCommandTool } from '@/components/dashboard/mobile-command/toolQuery'

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: { value: 'country=CA&role=exporter' },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(navigation.search.value),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      on() { return this },
      subscribe() { return this },
    }),
    removeChannel: vi.fn(),
  }),
}))

const supplyListing: MarketRow = [
  'Export-ready flower lot',
  'Reviewed Canadian supply for qualified buyers.',
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
      // This fixture is intentionally Global: the active context is Canada and
      // the strict Intel feed retains only exact Canada rows plus Global watch.
      market: 'Global',
      type: 'Regulatory',
      commercialImpact: 'Review export pathway implications.',
      timeAgo: '2h ago',
      confidence: 90,
      tag: { label: 'REGULATION', color: '#D9A441', bg: 'rgba(217,164,65,0.15)', border: 'rgba(217,164,65,0.35)' },
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

    expect(pulse).toEqual(['5', '1', '1'])
    expect(document.body.textContent).toContain('Open corridor execution plan')
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
  })

  it('keeps exactly one committed section mounted', () => {
    navigation.search.value = 'country=CA&role=exporter&page=intel&section=weekly-signals'
    const document = renderMobileCommand()

    expect(document.querySelector('[data-active-destination="weekly-signals"]')).not.toBeNull()
    expect(document.querySelector('.hvm2-section-rail')).not.toBeNull()
    expect(document.querySelectorAll('.hvm2-section-shell')).toHaveLength(1)
    expect(document.querySelector('#weekly-signals')).not.toBeNull()
    expect(document.querySelector('#overview')).toBeNull()
  })

  it('keeps scoped secondary reachability on the Command landing and other destinations', () => {
    const landing = renderMobileCommand()
    expect(landing.querySelector('[data-command-secondary-link="clinical"]')).not.toBeNull()
    expect(landing.querySelector('[data-command-secondary-link="jurisdiction"]')).not.toBeNull()

    navigation.search.value = 'country=CA&role=exporter&page=intel&section=weekly-signals'
    const intel = renderMobileCommand()
    expect(intel.querySelector('[data-command-secondary-link="clinical"]')).not.toBeNull()
    expect(intel.querySelector('[data-command-secondary-link="jurisdiction"]')).not.toBeNull()
  })

  it('offers a way back to the Command landing from the rail, and keeps the rail there', () => {
    navigation.search.value = 'country=CA&role=exporter&page=intel&section=weekly-signals'
    const intel = renderMobileCommand()
    expect(intel.querySelector('.hvm2-section-rail')).not.toBeNull()
    expect(intel.querySelector('[data-command-back-to-overview]')).not.toBeNull()
  })

  it('preserves a Clinical deep link while keeping Command active globally', () => {
    navigation.search.value = 'country=CA&role=exporter&page=clinical&section=clinical'
    const document = renderMobileCommand()
    expect(document.querySelector('[data-active-destination="overview"]')).not.toBeNull()
    expect(document.querySelector('#clinical')).not.toBeNull()
  })

  it('reaches the supported operational sections Command owns, and rails them once committed', () => {
    for (const section of SECTION_GROUPS.overview) {
      if (section === 'overview') continue
      const page = SECTION_TO_DESKTOP_PAGE[section]
      navigation.search.value = `country=CA&role=exporter&page=${page}&section=${section}`
      const document = renderMobileCommand()
      expect(document.querySelector(`#${section}`)).not.toBeNull()
      expect(document.querySelector('.hvm2-section-rail')).not.toBeNull()
    }
  })

  it('keeps catalogue marketplace controls under Market rather than operational domains', () => {
    navigation.search.value = 'country=CA&role=exporter&page=marketplace&section=marketplace'
    const document = renderMobileCommand()
    expect(document.querySelector('[data-active-destination="marketplace"]')).not.toBeNull()
    expect(document.querySelector('[data-marketplace-category-controls]')).not.toBeNull()
  })

  it('preserves complete marketplace and supply category universes', () => {
    const document = renderMobileCommand()
    expect(document.body.textContent).toContain('Cannabis')
    expect(document.body.textContent).toContain('Equipment')
    expect(document.body.textContent).toContain('Consumables')
  })

  it('normalizes marketplace tuples without corrupting confidence', () => {
    const document = renderMobileCommand()
    expect(document.body.textContent).toContain('78%')
  })

  it('keeps percentages and fractions distinct', () => {
    const document = renderMobileCommand({
      marketplaceRows: { cannabis: [[
        'Percent test', 'desc', 'Canada', 'Cannabis', 'approved', 'Direct', '0.82', 'p1', '', '',
      ]] },
    })
    expect(document.body.textContent).toContain('82%')
  })

  it('keeps query and contained-tool helpers stable', () => {
    expect(parseMobileCommandTool('corridor-plan')).toBe('corridor-plan')
    expect(parseMobileCommandTool('external-checkout')).toBeNull()
    expect(defaultListingTypeForView('equipment')).toBe('Used / Surplus Equipment')
  })
})
