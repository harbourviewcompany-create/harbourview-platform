import { describe, expect, it } from 'vitest'
import {
  GLOBE_INTRO,
  introTierBlend,
  lerpGlobeMaterialState,
  lerpHex,
  shouldFinishReveal,
  shouldForceGoldPlates,
  shouldStartReveal,
} from '@/lib/globe/globe-intro'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'

describe('globe intro', () => {
  it('forces gold while spinning and not reduced-motion', () => {
    expect(
      shouldForceGoldPlates({ introPhase: 'spinning', prefersReducedMotion: false }),
    ).toBe(true)
    expect(
      shouldForceGoldPlates({ introPhase: 'revealing', prefersReducedMotion: false }),
    ).toBe(false)
    expect(
      shouldForceGoldPlates({ introPhase: 'ready', prefersReducedMotion: false }),
    ).toBe(false)
  })

  it('never forces gold under reduced motion', () => {
    expect(
      shouldForceGoldPlates({ introPhase: 'spinning', prefersReducedMotion: true }),
    ).toBe(false)
  })

  it('does not start reveal while loading even after spin window', () => {
    expect(
      shouldStartReveal({
        spinElapsedMs: GLOBE_INTRO.spinDurationMs + 500,
        loading: true,
        prefersReducedMotion: false,
      }),
    ).toBe(false)
  })

  it('starts reveal after spin window when data is ready', () => {
    expect(
      shouldStartReveal({
        spinElapsedMs: GLOBE_INTRO.spinDurationMs,
        loading: false,
        prefersReducedMotion: false,
      }),
    ).toBe(true)
  })

  it('starts reveal immediately under reduced motion once data is ready', () => {
    expect(
      shouldStartReveal({
        spinElapsedMs: 0,
        loading: false,
        prefersReducedMotion: true,
      }),
    ).toBe(true)
  })

  it('blends 0 during spin, eases through reveal, 1 when ready', () => {
    expect(
      introTierBlend({
        introPhase: 'spinning',
        revealElapsedMs: 0,
        prefersReducedMotion: false,
      }),
    ).toBe(0)
    expect(
      introTierBlend({
        introPhase: 'ready',
        revealElapsedMs: 0,
        prefersReducedMotion: false,
      }),
    ).toBe(1)
    const mid = introTierBlend({
      introPhase: 'revealing',
      revealElapsedMs: GLOBE_INTRO.revealDurationMs / 2,
      prefersReducedMotion: false,
    })
    expect(mid).toBeGreaterThan(0.4)
    expect(mid).toBeLessThan(1)
  })

  it('finishes reveal after the lerp window', () => {
    expect(
      shouldFinishReveal({
        revealElapsedMs: GLOBE_INTRO.revealDurationMs,
        prefersReducedMotion: false,
      }),
    ).toBe(true)
    expect(
      shouldFinishReveal({
        revealElapsedMs: 10,
        prefersReducedMotion: false,
      }),
    ).toBe(false)
  })

  it('lerps hex colours and material metalness toward tier fill', () => {
    expect(lerpHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    const gold = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'country_select',
      regulatoryTier: null,
    })
    const tier = resolveCountryMaterialState({
      visualState: 'idle',
      layerId: 'country_select',
      regulatoryTier: 'legal_commercial_access',
    })
    const mid = lerpGlobeMaterialState(gold, tier, 0.5)
    expect(mid.metalness).toBeCloseTo((gold.metalness + tier.metalness) / 2, 5)
    expect(mid.plateBase).not.toBe(gold.plateBase)
    expect(mid.plateBase).not.toBe(tier.plateBase)
  })
})
