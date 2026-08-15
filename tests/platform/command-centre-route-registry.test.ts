import { describe, expect, it } from 'vitest'
import {
  ACTIVE_COMMAND_CENTRE_REDIRECTS,
  COMMAND_CENTRE_MODULES,
  COMMAND_CENTRE_ROUTE_POLICY,
  PUBLIC_ENTRY_EXCEPTIONS,
} from '../../config/command-centre-routes.mjs'

describe('production command centre route registry', () => {
  it('defines unique modules with desktop and mobile render targets', () => {
    const ids = COMMAND_CENTRE_MODULES.map(entry => entry.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const entry of COMMAND_CENTRE_MODULES) {
      expect(entry.desktopPage).toBeTruthy()
      expect(entry.mobileSection).toBeTruthy()
      expect(['launch-critical', 'important']).toContain(entry.criticality)
    }
  })

  it('defines each legacy source route once', () => {
    const sources = COMMAND_CENTRE_ROUTE_POLICY.map(route => route.source)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('activates only explicitly safe redirects', () => {
    const activeSources = new Set(ACTIVE_COMMAND_CENTRE_REDIRECTS.map(route => route.source))
    const redirectNow = COMMAND_CENTRE_ROUTE_POLICY.filter(route => route.mode === 'redirect-now')

    expect(activeSources.size).toBe(redirectNow.length)
    for (const route of redirectNow) expect(activeSources.has(route.source)).toBe(true)
    for (const route of COMMAND_CENTRE_ROUTE_POLICY.filter(route => route.mode !== 'redirect-now')) {
      expect(activeSources.has(route.source)).toBe(false)
    }
  })

  it('keeps public entry, authentication and legal routes outside consolidation redirects', () => {
    const redirectSources = new Set(COMMAND_CENTRE_ROUTE_POLICY.map(route => route.source))
    for (const route of PUBLIC_ENTRY_EXCEPTIONS) expect(redirectSources.has(route)).toBe(false)
  })

  it('retains canonical public entry surfaces outside the authenticated command route', () => {
    const publicProductRoutes = [
      '/intelligence',
      '/intelligence/country-briefs',
      '/intelligence/regulatory-pathways',
      '/signals',
      '/markets',
      '/compliance',
      '/professionals',
      '/reviewed-connections',
      '/network',
      '/education',
      '/network/clinical-education',
      '/intelligence/licensing-pathways',
      '/intelligence/logistics-trade-routes',
      '/marketplace',
      '/marketplace/listings',
      '/marketplace/services',
      '/marketplace/business-opportunities',
    ]

    for (const source of publicProductRoutes) {
      const policy = COMMAND_CENTRE_ROUTE_POLICY.find(route => route.source === source)
      expect(policy).toBeDefined()
      expect(policy?.mode).toBe('retain-public')
    }
  })

  it('keeps private counterparty review behind authenticated evidence controls', () => {
    const policy = COMMAND_CENTRE_ROUTE_POLICY.find(route => route.source === '/intelligence/counterparty-intelligence')
    expect(policy).toMatchObject({
      destination: '/dashboard?page=evidence',
      mode: 'redirect-now',
    })
  })

  it('activates only the three transaction workflows with verified in-shell reload parity', () => {
    for (const source of ['/marketplace/sell', '/marketplace/wanted', '/marketplace/financing']) {
      const policy = COMMAND_CENTRE_ROUTE_POLICY.find(route => route.source === source)
      expect(policy?.mode).toBe('redirect-now')
      expect(policy?.destination).toContain('tool=')
    }
    expect(COMMAND_CENTRE_ROUTE_POLICY.find(route => route.source === '/intake')?.mode).toBe('retain-public')
  })
})
