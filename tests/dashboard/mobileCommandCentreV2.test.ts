import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const parent = read('components/dashboard/MobileCommandCentreRebuild.tsx')
const model = read('components/dashboard/mobile-command/useMobileCommandModel.ts')
const contracts = read('components/dashboard/mobile-command/contracts.ts')
const workspace = read('components/dashboard/mobile-command/WorkspacePanels.tsx')
const core = read('components/dashboard/mobile-command/sections/CoreSections.tsx')
const intelligence = read('components/dashboard/mobile-command/sections/IntelligenceSections.tsx')
const operations = read('components/dashboard/mobile-command/sections/OperationsSections.tsx')
const domains = read('components/dashboard/mobile-command/sections/DomainSections.tsx')
const source = [parent, model, contracts, workspace, core, intelligence, operations, domains].join('\n')
const css = [
  read('components/dashboard/MobileCommandCentreRebuild.css'),
  read('components/dashboard/MobileCommandCentreWorkspaces.css'),
].join('\n')
const responsiveShell = read('components/dashboard/DashboardResponsiveShell.tsx')

describe('Mobile Command Centre rebuild contracts', () => {
  it('is the mobile renderer for the canonical Command Centre route', () => {
    expect(responsiveShell).toContain("import MobileCommandCentreRebuild from '@/components/dashboard/MobileCommandCentreRebuild'")
    expect(responsiveShell).toContain('? <MobileCommandCentreRebuild {...props} />')
    expect(responsiveShell).not.toContain('MobileCommandCentreV2')
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
      expect(parent).toContain(`sectionRef('${section}')`)
      expect(contracts).toContain(`${section.includes('-') ? `'${section}'` : section}:`)
    }
  })

  it('maps every mobile section to a desktop Command Centre page', () => {
    expect(contracts).toContain('SECTION_TO_DESKTOP_PAGE: Record<SectionId, CommandPage>')
    expect(model).toContain('page: SECTION_TO_DESKTOP_PAGE[section]')
    expect(model).toContain("return buildHref('/dashboard', baseContext")
    expect(model).toContain('router.replace(commandHref(id)')
    expect(parent).toContain("model.commandHref('overview', { page: 'organization' })")
  })

  it('keeps all new commercial workflows inside Mobile Command', () => {
    expect(workspace).toContain('DynamicMarketplaceIntakeForm')
    expect(workspace).toContain('FinancingInquiryForm')
    expect(core).toContain("onOpenTool('wanted-intake'")
    expect(core).toContain("onOpenTool('supply-intake'")
    expect(core).toContain("onOpenTool('introduction'")
    expect(domains).toContain("onOpenTool('financing-intake')")
    expect(source).not.toContain('routeHref')
    expect(source).not.toContain("href=\"/marketplace")
    expect(source).not.toContain("href=\"/signals")
    expect(source).not.toContain("href=\"/supply")
    expect(source).not.toContain("href=\"/network")
    expect(source).not.toContain("href=\"/account")
    expect(source).not.toContain("href=\"/intake")
  })

  it('splits the twenty sections into focused modules instead of one monolith', () => {
    expect(core).toContain('export function MarketplaceSection')
    expect(intelligence).toContain('export function WeeklySignalsSection')
    expect(operations).toContain('export function DirectoriesSection')
    expect(domains).toContain('export function FinancingSection')
    expect(model).toContain('export function useMobileCommandModel')
    expect(parent.split('\n').length).toBeLessThan(180)
    expect(core.split('\n').length).toBeLessThan(350)
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
    ]) expect(contracts).toContain(category)

    expect(core).toContain('Post wanted demand')
    expect(core).toContain('Submit supply')
    expect(core).toContain('Request financing')
  })

  it('preserves jurisdiction and role in every command-surface URL', () => {
    expect(parent).toContain("updateContext('country', event.target.value)")
    expect(parent).toContain("updateContext('role', event.target.value)")
    expect(model).toContain("const currentCountry = searchParams.get('country') || props.initialCountryIso2")
    expect(model).toContain("const currentRole = searchParams.get('role') || props.initialRoleId")
    expect(model).toContain('contextParams(currentCountry, currentRole)')
  })

  it('centralizes approved mediation and private-data boundary copy', () => {
    expect(contracts).toContain('MOBILE_COMMAND_COPY')
    expect(contracts).toContain('Request reviewed introduction')
    expect(contracts).toContain('Controlled by default')
    expect(contracts).toContain('No supplier identity, private source evidence, internal review notes or counterparty detail is released')
    expect(source).not.toContain('Contact seller directly')
    expect(source).not.toContain('Buy now')
    expect(source).not.toContain('Checkout')
  })

  it('normalizes confidence without converting an exact one-percent value into 100 percent', () => {
    expect(contracts).toContain('value > 0 && value < 1 ? value * 100 : value')
    expect(contracts).toContain('parseConfidence(row[6])')
  })

  it('provides labelled marketplace search and complete tab semantics', () => {
    expect(core).toContain('aria-label={searchLabel}')
    expect(core).toContain('role="tabpanel"')
    expect(core).toContain('aria-labelledby={`hvm2-tab-${activeMarketView}`}')
    expect(core).toContain('aria-controls="hvm2-market-panel"')
  })

  it('removes the rejected floating Modules launcher', () => {
    expect(source).not.toContain('⌘ Modules')
    expect(source).not.toContain('ccig-launcher')
    expect(source).not.toContain('ModuleLauncher')
    expect(css).not.toContain('ccig-launcher')
  })

  it('implements mobile safe-area, workspace and overflow protections', () => {
    expect(css).toContain('max-width: 100vw')
    expect(css).toContain('overflow-x: hidden')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('.hvm2-workspace')
    expect(css).toContain('.hvm2-inline-cta')
    expect(css).toContain('@media (max-width: 359px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
