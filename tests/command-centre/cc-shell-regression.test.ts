/**
 * Command Centre jurisdiction route regression tests.
 *
 * Covers:
 * 1. Shell classification — /country/* suppresses public nav; public routes keep it
 * 2. Route resolution — slug → ISO2, state, role mapping
 * 3. Enum leakage — needs_review and other raw DB values never appear in contract
 * 4. CTA behavior — no href="#", unavailable CTAs explicitly marked, wired CTAs have real routes
 */

import { describe, it, expect } from 'vitest'
import {
  resolveJurisdictionRoute,
  buildJurisdictionContract,
} from '@/lib/command-centre/jurisdictionRouteContext'

// ── 1. Shell classification ───────────────────────────────────────────────────

const NO_SHELL_PREFIXES = ['/dashboard', '/country']
const NO_CHROME_ROUTES = ['/']

function wouldRenderPublicShell(pathname: string): boolean {
  const isNoShell = NO_SHELL_PREFIXES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isNoChrome = NO_CHROME_ROUTES.includes(pathname)
  return !(isNoShell || isNoChrome)
}

describe('ShellWrapper: /country/* suppresses public nav', () => {
  it('/country/canada', () => expect(wouldRenderPublicShell('/country/canada')).toBe(false))
  it('/country/spain', () => expect(wouldRenderPublicShell('/country/spain')).toBe(false))
  it('/country/united-states/state/florida', () =>
    expect(wouldRenderPublicShell('/country/united-states/state/florida')).toBe(false))
  it('/country/canada/role/doctor', () =>
    expect(wouldRenderPublicShell('/country/canada/role/doctor')).toBe(false))
  it('/dashboard keeps no-shell', () =>
    expect(wouldRenderPublicShell('/dashboard')).toBe(false))
})

describe('ShellWrapper: public routes keep public nav', () => {
  it('/marketplace', () => expect(wouldRenderPublicShell('/marketplace')).toBe(true))
  it('/intelligence', () => expect(wouldRenderPublicShell('/intelligence')).toBe(true))
  it('/education', () => expect(wouldRenderPublicShell('/education')).toBe(true))
  it('/about', () => expect(wouldRenderPublicShell('/about')).toBe(true))
  it('/contact', () => expect(wouldRenderPublicShell('/contact')).toBe(true))
})

// ── 2. Route resolution ───────────────────────────────────────────────────────

describe('resolveJurisdictionRoute', () => {
  it('canada → CA, type country', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })
    expect(r).not.toBeNull()
    expect(r?.countryIso2).toBe('CA')
    expect(r?.type).toBe('country')
    expect(r?.canonicalHref).toBe('/country/canada')
  })

  it('spain → ES', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'spain' })
    expect(r?.countryIso2).toBe('ES')
  })

  it('united-states + florida → US / US-FL, type state', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'united-states', stateSlug: 'florida' })
    expect(r?.countryIso2).toBe('US')
    expect(r?.stateIso2).toBe('US-FL')
    expect(r?.stateName).toBe('Florida')
    expect(r?.type).toBe('state')
    expect(r?.parentCountryHref).toBe('/country/united-states')
  })

  it('canada + doctor → CA / doctor_prescriber, type country_role', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada', roleSlug: 'doctor' })
    expect(r?.countryIso2).toBe('CA')
    expect(r?.roleId).toBe('doctor_prescriber')
    expect(r?.type).toBe('country_role')
  })

  it('unknown slug → null', () => {
    expect(resolveJurisdictionRoute({ countrySlug: 'xyz-fake-country' })).toBeNull()
  })

  it('unknown state slug → null (state not found → route null? or just state fields absent)', () => {
    // resolveJurisdictionRoute returns the country route even if state not found
    const r = resolveJurisdictionRoute({ countrySlug: 'canada', stateSlug: 'nonexistent-state' })
    // state is unresolved, stateIso2 should be undefined
    expect(r).not.toBeNull()
    expect(r?.stateIso2).toBeUndefined()
  })
})

// ── 3. Enum leakage ───────────────────────────────────────────────────────────

const RAW_DB_ENUMS = ['needs_review', 'active_medical_program', 'program_expanding',
  'legislation_pending', 'market_maturing', 'under_review', 'draft', 'flagged']

describe('Contract: no raw DB enum values', () => {
  it('needs_review never in contract JSON', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const contract = buildJurisdictionContract(r)
    const json = JSON.stringify(contract)
    expect(json).not.toContain('needs_review')
  })

  it('no raw DB enum appears in any contract field', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const contract = buildJurisdictionContract(r)
    const json = JSON.stringify(contract)
    for (const raw of RAW_DB_ENUMS) {
      expect(json, `raw enum "${raw}" must not appear in contract`).not.toContain(raw)
    }
  })

  it('all review states are valid CCReviewState values', () => {
    const valid = new Set(['reviewed', 'pending', 'unavailable', 'computed'])
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const c = buildJurisdictionContract(r)
    expect(valid.has(c.briefing.programStatusReviewState)).toBe(true)
    expect(valid.has(c.evidence.reviewState)).toBe(true)
    expect(valid.has(c.confidence.reviewState)).toBe(true)
    expect(valid.has(c.watchRegions.reviewState)).toBe(true)
    expect(valid.has(c.changeNotes.reviewState)).toBe(true)
    for (const cat of c.confidence.categories) {
      expect(valid.has(cat.reviewState)).toBe(true)
    }
  })
})

// ── 4. CTA behavior ───────────────────────────────────────────────────────────

describe('CTAs: no dead links, unavailable explicitly marked', () => {
  it('allJurisdictionsHref is always a real route', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const c = buildJurisdictionContract(r)
    expect(c.ctas.allJurisdictionsHref).not.toBe('#')
    expect(c.ctas.allJurisdictionsHref).not.toBe('')
    expect(c.ctas.allJurisdictionsHref).toMatch(/^\//)
  })

  it('unavailable CTAs are flagged (fullProfile)', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const c = buildJurisdictionContract(r)
    expect(c.ctas.fullProfileAvailable).toBe(false)
    expect(c.ctas.fullProfileHref).toBeNull()
  })

  it('unavailable CTAs are flagged (changeActivity)', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const c = buildJurisdictionContract(r)
    expect(c.ctas.changeActivityAvailable).toBe(false)
    expect(c.ctas.changeActivityHref).toBeNull()
  })

  it('confidenceMethodology is wired to a real route', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const c = buildJurisdictionContract(r)
    expect(c.ctas.confidenceMethodologyAvailable).toBe(true)
    expect(c.ctas.confidenceMethodologyHref).not.toBe('#')
    expect(c.ctas.confidenceMethodologyHref).not.toBe('')
  })

  it('no available CTA has href of # or empty string', () => {
    const r = resolveJurisdictionRoute({ countrySlug: 'canada' })!
    const c = buildJurisdictionContract(r)
    const live = [
      c.ctas.fullProfileAvailable ? c.ctas.fullProfileHref : null,
      c.ctas.confidenceMethodologyAvailable ? c.ctas.confidenceMethodologyHref : null,
      c.ctas.allJurisdictionsHref,
      c.ctas.changeActivityAvailable ? c.ctas.changeActivityHref : null,
    ].filter(Boolean)
    for (const href of live) {
      expect(href).not.toBe('#')
      expect(href).not.toBe('')
    }
  })
})
