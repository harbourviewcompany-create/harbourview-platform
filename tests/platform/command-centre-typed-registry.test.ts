import { describe, expect, it } from 'vitest'
import {
  buildCommandCentreHref,
  COMMAND_CENTRE_MODULE_REGISTRY,
  COMMAND_CENTRE_PAGE_IDS,
  getCommandCentreModule,
  getCommandCentreReadinessSummary,
  getMobileSectionForPage,
  normalizeCommandPage,
} from '@/lib/platform/commandCentreRegistry'

describe('typed Command Centre registry', () => {
  it('exposes the complete 32-module universe without duplicate ids', () => {
    expect(COMMAND_CENTRE_MODULE_REGISTRY).toHaveLength(32)
    expect(new Set(COMMAND_CENTRE_MODULE_REGISTRY.map(module => module.id)).size).toBe(32)
    expect(COMMAND_CENTRE_MODULE_REGISTRY.every(module => module.desktopPage && module.mobileSection)).toBe(true)
  })

  it('parses every supported desktop page and rejects unknown pages', () => {
    for (const page of COMMAND_CENTRE_PAGE_IDS) {
      expect(normalizeCommandPage(page)).toBe(page)
      expect(getMobileSectionForPage(page)).toBeTruthy()
    }
    expect(normalizeCommandPage('insurance')).toBe('insurance')
    expect(normalizeCommandPage('licences')).toBe('licences')
    expect(normalizeCommandPage('talent')).toBe('talent')
    expect(normalizeCommandPage('not-a-command-page')).toBeNull()
    expect(normalizeCommandPage(null)).toBeNull()
  })

  it('builds one responsive command URL with preserved context', () => {
    const href = buildCommandCentreHref('marketplace', {
      country: 'DE',
      role: 'importer',
      marketView: 'wanted',
      tool: 'wanted-intake',
    })
    const url = new URL(href, 'https://harbourview.example')

    expect(url.pathname).toBe('/dashboard')
    expect(url.searchParams.get('country')).toBe('DE')
    expect(url.searchParams.get('role')).toBe('importer')
    expect(url.searchParams.get('page')).toBe('marketplace')
    expect(url.searchParams.get('section')).toBe('marketplace')
    expect(url.searchParams.get('marketView')).toBe('wanted')
    expect(url.searchParams.get('tool')).toBe('wanted-intake')
  })

  it('maps every registered module to a deterministic mobile destination', () => {
    for (const mod of COMMAND_CENTRE_MODULE_REGISTRY) {
      expect(getMobileSectionForPage(mod.desktopPage)).toBeTruthy()
      expect(getCommandCentreModule(mod.id)).toEqual(mod)
    }
    expect(getMobileSectionForPage('marketplace')).toBe('marketplace')
    expect(getMobileSectionForPage('experts')).toBe('network')
  })

  it('reports the complete readiness inventory without enforcing count at import time', () => {
    const summary = getCommandCentreReadinessSummary()
    expect(summary.totalModules).toBe(32)
    expect(summary.launchCriticalModules + summary.importantModules).toBe(32)
    expect(summary.uniqueDesktopPages).toBe(COMMAND_CENTRE_PAGE_IDS.length)
    expect(summary.configuredDesktopPages).toBeGreaterThan(20)
    // Unique mobile section destinations mapped from product modules (directories folded into network).
    expect(summary.mobileSections).toBe(17)
  })
})
