import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { MarketRow } from '@/components/dashboard/CommandCentre'
import {
  MARKET_TABS,
  MOBILE_COMMAND_COPY,
  PAGE_TO_SECTION,
  SECTION_NAV,
  SECTION_TO_DESKTOP_PAGE,
  SUPPLY_TABS,
  clampPercent,
  confidenceFractionToPercent,
  defaultListingTypeForView,
  matchesQuery,
  normalizeListing,
  parseMobileCommandTool,
} from '@/components/dashboard/mobile-command/contracts'

const root = process.cwd()

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readSourceTree(relativeDirectory: string): string {
  const directory = path.join(root, relativeDirectory)
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(relativeDirectory, entry.name)
      if (entry.isDirectory()) return [readSourceTree(relativePath)]
      if (!/\.(ts|tsx)$/.test(entry.name)) return []
      return [read(relativePath)]
    })
    .join('\n')
}

const mobileCommandSource = [
  read('components/dashboard/MobileCommandCentreRebuild.tsx'),
  read('components/dashboard/DashboardResponsiveShell.tsx'),
  readSourceTree('components/dashboard/mobile-command'),
].join('\n')
const mobileCommandCss = [
  read('components/dashboard/MobileCommandCentreRebuild.css'),
  read('components/dashboard/MobileCommandCentreWorkspaces.css'),
].join('\n')

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

  it('contains every section implementation and no external primary command dependency', () => {
    for (const section of SECTION_NAV) {
      expect(mobileCommandSource).toContain(`id=\"${section.id}\"`)
      expect(mobileCommandSource).toContain(`sectionRef('${section.id}')`)
    }

    expect(mobileCommandSource).toContain('DynamicMarketplaceIntakeForm')
    expect(mobileCommandSource).toContain('FinancingInquiryForm')
    expect(mobileCommandSource).not.toContain('⌘ Modules')
    expect(mobileCommandSource).not.toContain('ccig-launcher')
    expect(mobileCommandSource).not.toMatch(/href=["']\/(marketplace|signals|supply|network|account|intake)/)
  })

  it('implements mobile safe-area, workspace, motion and overflow protections', () => {
    expect(mobileCommandCss).toContain('max-width: 100vw')
    expect(mobileCommandCss).toContain('overflow-x: hidden')
    expect(mobileCommandCss).toContain('env(safe-area-inset-bottom)')
    expect(mobileCommandCss).toContain('.hvm2-workspace')
    expect(mobileCommandCss).toContain('.hvm2-inline-cta')
    expect(mobileCommandCss).toContain('@media (max-width: 359px)')
    expect(mobileCommandCss).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
