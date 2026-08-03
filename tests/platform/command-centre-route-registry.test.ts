import { describe, expect, it } from 'vitest'
import {
  ACTIVE_COMMAND_CENTRE_REDIRECTS,
  COMMAND_CENTRE_MODULES,
  COMMAND_CENTRE_ROUTE_POLICY,
  PUBLIC_ENTRY_EXCEPTIONS,
} from '../../config/command-centre-routes.mjs'

describe('production command centre route registry', () => {
  it('defines unique modules with desktop and mobile render targets', () => {
    const ids = COMMAND_CENTRE_MODULES.map(module => module.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const module of COMMAND_CENTRE_MODULES) {
      expect(module.desktopPage).toBeTruthy()
      expect(module.mobileSection).toBeTruthy()
      expect(['launch-critical', 'important']).toContain(module.criticality)
    }
  })

  it('defines each legacy source route once', () => {
    const sources = COMMAND_CENTRE_ROUTE_POLICY.map(route => route.source)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('activates only routes already represented in both command shells', () => {
    const activeSources = new Set(ACTIVE_COMMAND_CENTRE_REDIRECTS.map(route => route.source))
    const redirectNow = COMMAND_CENTRE_ROUTE_POLICY.filter(route => route.mode === 'redirect-now')

    expect(activeSources.size).toBe(redirectNow.length)
    for (const route of redirectNow) {
      expect(activeSources.has(route.source)).toBe(true)
    }
    for (const route of COMMAND_CENTRE_ROUTE_POLICY.filter(route => route.mode !== 'redirect-now')) {
      expect(activeSources.has(route.source)).toBe(false)
    }
  })

  it('keeps public entry, authentication and legal routes outside consolidation redirects', () => {
    const redirectSources = new Set(COMMAND_CENTRE_ROUTE_POLICY.map(route => route.source))
    for (const route of PUBLIC_ENTRY_EXCEPTIONS) {
      expect(redirectSources.has(route)).toBe(false)
    }
  })

  it('does not retire protected live-data or disclaimer routes before parity', () => {
    const protectedRoutes = [
      '/intelligence/licensing-pathways',
      '/intelligence/logistics-trade-routes',
      '/education',
      '/network/clinical-education',
      '/marketplace',
      '/marketplace/listings',
      '/marketplace/services',
      '/marketplace/business-opportunities',
    ]

    for (const source of protectedRoutes) {
      const policy = COMMAND_CENTRE_ROUTE_POLICY.find(route => route.source === source)
      expect(policy).toBeDefined()
      expect(policy?.mode).toBe('redirect-after-parity')
    }
  })

  it('keeps transactional routes shareable until intercepted shell workflows exist', () => {
    for (const source of ['/marketplace/sell', '/marketplace/wanted', '/marketplace/financing', '/intake']) {
      const policy = COMMAND_CENTRE_ROUTE_POLICY.find(route => route.source === source)
      expect(policy?.mode).toBe('intercept-next')
    }
  })
})
