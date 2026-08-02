import { describe, expect, it } from 'vitest'
import {
  COMMAND_CENTRE_MODULES,
  buildCommandCentreModuleHref,
  getCommandCentreModule,
  isCustomCommandCentreModule,
  normalizeCommandCentreModule,
  type CommandCentreModule,
} from '@/lib/dashboard/commandCentreIntegration'

const REQUIRED: CommandCentreModule[] = [
  'briefing',
  'digest',
  'personal-briefings',
  'intel',
  'search',
  'compliance',
  'market',
  'marketplace',
  'supply',
  'financing',
  'directories',
  'talent',
  'genetics',
  'clinical',
  'watchlist',
  'pathways',
]

describe('Command Centre integration registry', () => {
  it('contains every required authenticated product module exactly once', () => {
    const ids = COMMAND_CENTRE_MODULES.map(definition => definition.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining(REQUIRED))
  })

  it('maps every module to an existing CommandPage parent', () => {
    for (const id of REQUIRED) {
      const definition = getCommandCentreModule(id)
      expect(definition.page).toMatch(/^[a-z][a-z-]+$/)
    }
  })

  it('builds context-preserving canonical dashboard links', () => {
    expect(buildCommandCentreModuleHref('briefing', { country: 'ca', role: 'importer' }))
      .toBe('/dashboard?country=CA&role=importer')
    expect(buildCommandCentreModuleHref('search', { country: 'ca', role: 'importer' }))
      .toBe('/dashboard?country=CA&role=importer&page=signals&module=search')
    expect(buildCommandCentreModuleHref('supply'))
      .toBe('/dashboard?page=marketplace&module=supply')
  })

  it('normalizes product-language aliases', () => {
    expect(normalizeCommandCentreModule('intelligence')).toBe('intel')
    expect(normalizeCommandCentreModule('my_briefings')).toBe('personal-briefings')
    expect(normalizeCommandCentreModule('trade-finance')).toBe('financing')
    expect(normalizeCommandCentreModule('professionals')).toBe('directories')
    expect(normalizeCommandCentreModule('not-a-module')).toBeNull()
  })

  it('marks only gateway-rendered modules as custom', () => {
    expect(isCustomCommandCentreModule('search')).toBe(true)
    expect(isCustomCommandCentreModule('supply')).toBe(true)
    expect(isCustomCommandCentreModule('briefing')).toBe(false)
    expect(isCustomCommandCentreModule('clinical')).toBe(false)
  })
})
