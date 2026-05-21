import { describe, expect, it } from 'vitest'
import { ROUTER_BOTTOM_SHEET_FOCUS_LIFECYCLE } from '@/components/globe/RouterBottomSheet'
import { globeIntentOptions, globeMarketOptions, globeRoleOptions, parseGlobeRouteState } from '@/components/harbourview/globe/globeRouteState'
import { getRouteControlA11yLabel } from '@/components/harbourview/globe/HarbourviewGlobeRouteController'

describe('globe accessibility contracts', () => {
  it('documents the RouterBottomSheet focus lifecycle', () => {
    expect(ROUTER_BOTTOM_SHEET_FOCUS_LIFECYCLE.entryTarget).toContain('first interactive element')
    expect(ROUTER_BOTTOM_SHEET_FOCUS_LIFECYCLE.tabBounds).toContain('cycled within the sheet')
    expect(ROUTER_BOTTOM_SHEET_FOCUS_LIFECYCLE.escapeBackBehavior).toContain('Escape triggers')
    expect(ROUTER_BOTTOM_SHEET_FOCUS_LIFECYCLE.focusReturn).toContain('previously active element')
  })

  it('uses stable SR labels and pressed/current semantics for market/role/intent/fallback controls', () => {
    expect(getRouteControlA11yLabel.market(globeMarketOptions[0].label)).toMatch(/^Market /)
    expect(getRouteControlA11yLabel.role(globeRoleOptions[0].label)).toMatch(/^Role /)
    expect(getRouteControlA11yLabel.intent(globeIntentOptions[0].label)).toMatch(/^Intent /)
  })

  it('parses fallback route state for SR status announcements', () => {
    const state = parseGlobeRouteState(new URLSearchParams('market=unknown&role=none&intent=none&route=fallback'))
    expect(state.kind).toBe('fallback')
    expect(state.invalidParams).toEqual(expect.arrayContaining(['market=unknown', 'role=none', 'intent=none']))
  })
})
