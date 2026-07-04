import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'

describe('globe router subdivision routing', () => {
  it('routes a single selected US state to the United States country-role dashboard with region context', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'US-OK',
      countryIso2s: ['US-OK'],
      roleId: 'importer',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/country/united-states/role/importer?')
    expect(result.href).toContain('country=US-OK')
    expect(result.href).toContain('countries=US-OK')
    expect(result.href).toContain('role=importer')
    expect(result.href).toContain('region=US-OK')
    expect(result.href).not.toContain('/market-selection')
  })

  it('routes a single selected Canadian province to the Canada country-role dashboard with region context', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'CA-ON',
      countryIso2s: ['CA-ON'],
      roleId: 'importer',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/country/canada/role/importer?')
    expect(result.href).toContain('country=CA-ON')
    expect(result.href).toContain('countries=CA-ON')
    expect(result.href).toContain('role=importer')
    expect(result.href).toContain('region=CA-ON')
    expect(result.href).not.toContain('/market-selection')
  })

  it('preserves normal country-role routing for Mexico exporter', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'MX',
      countryIso2s: ['MX'],
      roleId: 'exporter',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/country/mexico/role/exporter?')
    expect(result.href).toContain('country=MX')
    expect(result.href).toContain('countries=MX')
    expect(result.href).toContain('role=exporter')
    expect(result.href).not.toContain('region=')
  })

  it('does not collapse true multi-market subdivision selections into a single country dashboard', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'US-OK',
      countryIso2s: ['US-OK', 'CA-ON'],
      roleId: 'importer',
      mode: 'multi_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.href).toContain('/market-selection?')
    expect(result.href).not.toContain('/country/united-states/role/importer')
    expect(result.href).not.toContain('/country/canada/role/importer')
  })

  it('does not hardcode Germany on the market-selection page', () => {
    const source = readFileSync('app/market-selection/page.tsx', 'utf8')

    expect(source).not.toContain('initialCountry="DE"')
    // initialCountry is always dynamic (derived from URL params), never a literal string
    expect(source).toContain('initialCountry={')
  })
})
