import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { describe, expect, it, vi } from 'vitest'
import type { MarketRow } from '@/components/dashboard/CommandCentre'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import {
  MARKET_TABS,
  MOBILE_COMMAND_COPY,
  PAGE_TO_SECTION,
  PRIMARY_NAV,
  SECTION_GROUPS,
  SECTION_NAV,
  SECTION_TO_DESKTOP_PAGE,
  SECTION_TO_GROUP,
  type PrimarySectionId,
  SUPPLY_TABS,
  clampPercent,
  confidenceFractionToPercent,
  defaultListingTypeForView,
  matchesQuery,
  normalizeListing,
  parseMobileCommandTool,
} from '@/components/dashboard/mobile-command/contracts'

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams('country=CA&role=exporter'),
}))

vi.mock('@/components/marketplace/DynamicMarketplaceIntakeForm', () => ({
  DynamicMarketplaceIntakeForm: () => null,
}))

vi.mock('@/app/marketplace/financing/FinancingInquiryForm', () => ({
  default: () => null,
}))

import MobileCommandCentreRebuild from '@/components/dashboard/MobileCommandCentreRebuild'

function mobileProps(): MobileCommandCentreProps {
  const listing: MarketRow = [
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

  return {
    signals: [],
    eduCategories: [],
    initialCountryIso2: 'CA',
    initialRoleId: 'exporter',
    marketplaceRows: { cannabis: [listing] },
    wantedCount: 1,
    pipeline: {
      wanted: 1,
      matched: 0,
      proof_review: 0,
      inquiry: 0,
      deal_room: 0,
    },
    hasOrg: true,
  }
}

function renderMobileCommand(overrides: Partial<MobileCommandCentreProps> = {}) {
  const markup = renderToStaticMarkup(
    createElement(MobileCommandCentreRebuild, { ...mobileProps(), ...overrides }),
  )
  return parseHTML(`<!doctype html><html><body>${markup}</body></html>`).document
}

describe('Mobile Command Centre contracts', () => {
  it('defines one exhaustive desktop target for every mobile section', () => {
    const sectionIds = SECTION_NAV.map(section => section.id)
    expect(sectionIds).toHaveLength(20)
    expect(new Set(sectionIds).size).toBe(sectionIds.length)
    expect(Object.keys(SECTION_TO_DESKTOP_PAGE).sort()).toEqual([...sectionIds].sort())

    for (const pageTarget of Object.values(PAGE_TO_SECTION)) {
      expect(sectionIds).toContain(pageTarget)
    }
  })

  it('preserves the complete marketplace and supply universes', () => {
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

  it('normalizes marketplace tuples by named position without corrupting confidence', () => {
    const row: MarketRow = [
      'Bulk flower lot',
      'Reviewed supply record',
      'Canada',
      'Cannabis',
      'approved',
      'Harbourview mediated',
      '1',
      'listing-1',
      '',
      '',
    ]

    expect(normalizeListing(row, 0, 'cannabis', 'Global')).toEqual({
      id: 'listing-1',
      title: 'Bulk flower lot',
      summary: 'Reviewed supply record',
      jurisdiction: 'Canada',
      category: 'Cannabis',
      status: 'approved',
      channel: 'Harbourview mediated',
      confidence: 1,
      view: 'cannabis',
    })
  })

  it('keeps stored percentages and confidence fractions as distinct units', () => {
    expect(clampPercent(1)).toBe(1)
    expect(clampPercent(101)).toBe(100)
    expect(confidenceFractionToPercent(0.72)).toBe(72)
    expect(confidenceFractionToPercent(1)).toBe(100)
  })

  it('normalizes query casing and whitespace inside the query helper', () => {
    expect(matchesQuery('  CANADA ', ['Canada', 'Germany'])).toBe(true)
    expect(matchesQuery('extract', ['Cultivation', 'Extraction'])).toBe(true)
    expect(matchesQuery('', ['Anything'])).toBe(true)
    expect(matchesQuery('missing', ['Anything'])).toBe(false)
  })

  it('parses only supported contained tools and resolves intake types', () => {
    expect(parseMobileCommandTool('wanted-intake')).toBe('wanted-intake')
    expect(parseMobileCommandTool('financing-intake')).toBe('financing-intake')
    expect(parseMobileCommandTool('external-checkout')).toBeNull()
    expect(defaultListingTypeForView('equipment')).toBe('Used / Surplus Equipment')
    expect(defaultListingTypeForView('wanted')).toBe('Wanted Request')
  })

  it('keeps mediation and release-control copy centralized', () => {
    expect(MOBILE_COMMAND_COPY.reviewedIntroduction).toBe('Request reviewed introduction')
    expect(MOBILE_COMMAND_COPY.controlTitle).toBe('Controlled by default')
    expect(MOBILE_COMMAND_COPY.controlDetail).toContain('No supplier identity')
    expect(MOBILE_COMMAND_COPY.financingInquiryDescription).toContain('does not approve credit')
  })

  it('folds every section under exactly one of the five destinations', () => {
    const grouped = Object.values(SECTION_GROUPS).flat()

    expect(grouped).toHaveLength(SECTION_NAV.length)
    expect(new Set(grouped).size).toBe(grouped.length)
    expect([...grouped].sort()).toEqual(SECTION_NAV.map(section => section.id).sort())

    // Every destination is a real section, and owns itself.
    for (const destination of PRIMARY_NAV) {
      expect(SECTION_GROUPS[destination.id as PrimarySectionId]).toBeDefined()
      expect(SECTION_TO_GROUP[destination.id]).toBe(destination.id)
    }

    for (const section of SECTION_NAV) {
      expect(SECTION_TO_GROUP[section.id], section.id).toBeDefined()
    }
  })

  it('mounts only the active destination, not all 20 sections', () => {
    // The renderer used to mount every section at once and treat the bottom nav
    // as scroll anchors, which is what made the surface one endless page.
    const document = renderMobileCommand()
    expect(document.querySelector('[data-mobile-command-version="2"]')).not.toBeNull()

    const rendered = [...document.querySelectorAll('.hvm2-main > section')].map(node => node.id)
    expect(rendered).toEqual(SECTION_GROUPS.overview)
    expect(rendered.length).toBeLessThan(SECTION_NAV.length)

    // Sections owned by other destinations must not be in the DOM at all.
    for (const id of SECTION_GROUPS.jurisdiction) {
      expect(document.querySelector(`#${id}`), id).toBeNull()
    }

    expect(document.querySelector('.hvm2-bottom-nav')).not.toBeNull()
    expect(document.body.textContent).toContain('Operator command centre')
    expect(document.body.textContent).not.toContain('⌘ Modules')
  })

  it('renders the destination that owns the requested page', () => {
    const document = renderMobileCommand({ initialPage: 'marketplace' })

    const rendered = [...document.querySelectorAll('.hvm2-main > section')].map(node => node.id)
    expect(rendered).toEqual(SECTION_GROUPS.marketplace)
    expect(document.body.textContent).toContain('Bulk flower lot')

    // The owning tab is marked current, not merely the section.
    const current = document.querySelector('.hvm2-bottom-nav button[aria-current="page"]')
    expect(current?.textContent).toContain('Market')
  })

  it('scopes the section rail to the active destination', () => {
    const document = renderMobileCommand({ initialPage: 'compliance' })

    const rail = [...document.querySelectorAll('.hvm2-section-rail button')]
    expect(rail).toHaveLength(SECTION_GROUPS.jurisdiction.length)

    const current = document.querySelector('.hvm2-bottom-nav button[aria-current="page"]')
    expect(current?.textContent).toContain('Context')
  })

  it('renders canonical dashboard hrefs for progressive mobile workflows', () => {
    const document = renderMobileCommand({ initialPage: 'marketplace' })
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>('.hvm2-root a[href]')]
    expect(anchors.length).toBeGreaterThan(0)

    for (const anchor of anchors) {
      const target = new URL(anchor.getAttribute('href') ?? '', 'https://harbourview.test')
      expect(target.pathname, anchor.textContent ?? '').toBe('/dashboard')
      expect(target.searchParams.get('country')).toBe('CA')
      expect(target.searchParams.get('role')).toBe('exporter')
    }

    const byText = (label: string) => anchors.find(anchor => anchor.textContent?.includes(label))
    const wanted = new URL(byText('Post wanted demand')?.getAttribute('href') ?? '', 'https://harbourview.test')
    expect(wanted.searchParams.get('section')).toBe('marketplace')
    expect(wanted.searchParams.get('tool')).toBe('wanted-intake')
    expect(wanted.searchParams.get('marketView')).toBe('wanted')

    // Cross-destination link: this anchor lives in the Marketplace section but
    // targets `financing`, which folds under Actions. Deep links across groups
    // must still resolve to the owning destination.
    const financing = new URL(byText('Request financing')?.getAttribute('href') ?? '', 'https://harbourview.test')
    expect(financing.searchParams.get('section')).toBe('financing')
    expect(financing.searchParams.get('tool')).toBe('financing-intake')
    expect(SECTION_TO_GROUP.financing).toBe('next-actions')
  })
})
