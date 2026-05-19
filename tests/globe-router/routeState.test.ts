import { describe, expect, it } from 'vitest'
import { createGlobeQueryString, parseGlobeRouteState } from '@/components/harbourview/globe/routeState'

describe('globe route state', () => {
  it('handles default state', () => {
    const state = parseGlobeRouteState(new URLSearchParams(''))
    expect(state.selectedMarkets).toEqual([])
    expect(state.sheet).toBeNull()
    expect(state.fallback).toBe(false)
  })

  it('handles selected and multi-market states', () => {
    const selected = parseGlobeRouteState(new URLSearchParams('market=germany'))
    expect(selected.selectedMarkets).toEqual(['germany'])

    const multi = parseGlobeRouteState(new URLSearchParams('markets=germany,colombia'))
    expect(multi.selectedMarkets).toEqual(['germany', 'colombia'])
  })

  it('supports sheet states and fallback', () => {
    expect(parseGlobeRouteState(new URLSearchParams('sheet=role')).sheet).toBe('role')
    expect(parseGlobeRouteState(new URLSearchParams('sheet=intent')).sheet).toBe('intent')
    expect(parseGlobeRouteState(new URLSearchParams('sheet=multi')).sheet).toBe('multi')
    expect(parseGlobeRouteState(new URLSearchParams('sheet=fallback')).fallback).toBe(true)
  })

  it('normalizes invalid params to fallback', () => {
    const state = parseGlobeRouteState(new URLSearchParams('market=unknown&sheet=bad'))
    expect(state.invalidParams).toBe(true)
    expect(state.fallback).toBe(true)
    expect(state.selectedMarkets).toEqual([])
  })

  it('creates query strings from state', () => {
    expect(createGlobeQueryString({ selectedMarkets: [], sheet: null, fallback: false, invalidParams: false })).toBe('')
    expect(createGlobeQueryString({ selectedMarkets: ['germany'], sheet: 'role', fallback: false, invalidParams: false })).toBe('?market=germany&sheet=role')
    expect(createGlobeQueryString({ selectedMarkets: ['germany', 'colombia'], sheet: 'multi', fallback: false, invalidParams: false })).toBe('?markets=germany%2Ccolombia&sheet=multi')
  })
})
