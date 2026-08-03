import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('Mobile Command Centre V2 contracts', () => {
  const source = read('components/dashboard/MobileCommandCentreV2.tsx')
  const css = read('components/dashboard/MobileCommandCentreV2.css')
  const responsiveShell = read('components/dashboard/DashboardResponsiveShell.tsx')

  it('is the mobile shell selected by DashboardResponsiveShell', () => {
    expect(responsiveShell).toContain("import MobileCommandCentreV2 from '@/components/dashboard/MobileCommandCentreV2'")
    expect(responsiveShell).toContain('? <MobileCommandCentreV2 {...props} />')
    expect(responsiveShell).not.toContain("import MobileCommandCentre from '@/components/dashboard/MobileCommandCentre'")
  })

  it('contains the complete authorized mobile command section universe', () => {
    for (const section of [
      'overview',
      'live-status',
      'market-intelligence',
      'marketplace',
      'supply',
      'next-actions',
      'weekly-signals',
      'personal-briefing',
      'search',
      'education',
      'jurisdiction',
      'market-status',
      'review-gates',
      'directories',
      'talent',
      'genetics',
      'clinical',
      'compliance',
      'network',
      'financing',
    ]) {
      expect(source).toContain(`id=\"${section}\"`)
      expect(source).toContain(`ref={registerSection('${section}')}`)
    }
  })

  it('exposes every new Command Centre capability as an explicit section', () => {
    for (const label of [
      'Market intelligence',
      'Marketplace control',
      'Supply',
      'Trade financing',
      'Directories',
      'Personal briefing',
      'Search',
      'Talent',
      'Genetics',
      'Clinical',
      'Education path',
      'Compliance',
      'Network',
    ]) {
      expect(source).toContain(`label: '${label}'`)
    }
    expect(source).toContain('JOB_LISTINGS')
    expect(source).toContain('marketMetrics.map')
    expect(source).toContain('tradeFlows.map')
    expect(source).toContain('supplyRows.map')
    expect(source).toContain('directoryRecords.map')
  })

  it('keeps every marketplace category visible without narrowing scope', () => {
    for (const category of [
      "{ id: 'cannabis', label: 'Cannabis' }",
      "{ id: 'wanted', label: 'Wanted' }",
      "{ id: 'opportunities', label: 'Opportunities' }",
      "{ id: 'equipment', label: 'Equipment' }",
      "{ id: 'consumables', label: 'Consumables' }",
      "{ id: 'services', label: 'Services' }",
      "{ id: 'new-products', label: 'New products' }",
    ]) {
      expect(source).toContain(category)
    }
    expect(source).toContain('Post wanted demand')
    expect(source).toContain('Submit supply')
    expect(source).toContain('Request financing')
  })

  it('preserves jurisdiction and role as explicit URL-backed context controls', () => {
    expect(source).toContain("updateContext('country', event.target.value)")
    expect(source).toContain("updateContext('role', event.target.value)")
    expect(source).toContain("params.set('section', activeSection)")
    expect(source).toContain("params.delete(key)")
  })

  it('preserves Harbourview mediation and private-data boundaries', () => {
    expect(source).toContain('Request reviewed introduction')
    expect(source).toContain('Controlled by default')
    expect(source).toContain('No supplier identity, private source evidence, internal review notes or counterparty detail is released')
    expect(source).not.toContain('Contact seller directly')
    expect(source).not.toContain('Buy now')
    expect(source).not.toContain('Checkout')
  })

  it('removes the rejected floating Modules launcher', () => {
    expect(source).not.toContain('⌘ Modules')
    expect(source).not.toContain('ccig-launcher')
    expect(source).not.toContain('ModuleLauncher')
    expect(css).not.toContain('ccig-launcher')
  })

  it('implements mobile safe-area and overflow protections', () => {
    expect(css).toContain('max-width:100vw')
    expect(css).toContain('overflow-x:hidden')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('@media(max-width:359px)')
    expect(css).toContain('@media(prefers-reduced-motion:reduce)')
  })
})
