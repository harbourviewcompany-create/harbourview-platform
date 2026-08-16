import { describe, expect, it } from 'vitest'
import {
  GLOBE_INTRO,
  introTierBlend,
  lerpHex,
  resolveIntroPlateMaterial,
  shouldFinishReveal,
  shouldForceGoldPlates,
  shouldStartReveal,
  shouldUseMetallicGoldShader,
} from '@/lib/globe/globe-intro'

describe('globe intro', () => {
  it('forces gold while spinning and not reduced-motion', () => {
    expect(
      shouldForceGoldPlates({ introPhase: 'spinning', prefersReducedMotion: false }),
    ).toBe(true)
    expect(
      shouldForceGoldPlates({ introPhase: 'revealing', prefersReducedMotion: false }),
    ).toBe(false)
  })

  it('never forces gold under reduced motion', () => {
    expect(
      shouldForceGoldPlates({ introPhase: 'spinning', prefersReducedMotion: true }),
    ).toBe(false)
  })

  it('does not start reveal while loading even after a full orbit', () => {
    expect(
      shouldStartReveal({
        azimuthAccumRad: GLOBE_INTRO.fullOrbitRad,
        spinElapsedMs: GLOBE_INTRO.spinDurationMs,
        loading: true,
        prefersReducedMotion: false,
      }),
    ).toBe(false)
  })

  it('starts reveal after a measured full orbit when data is ready', () => {
    expect(
      shouldStartReveal({
        azimuthAccumRad: GLOBE_INTRO.fullOrbitRad,
        spinElapsedMs: 500,
        loading: false,
        prefersReducedMotion: false,
      }),
    ).toBe(true)
  })

  it('starts reveal on safety timeout if azimuth never reaches a full turn', () => {
    expect(
      shouldStartReveal({
        azimuthAccumRad: 0.1,
        spinElapsedMs: GLOBE_INTRO.spinMaxDurationMs,
        loading: false,
        prefersReducedMotion: false,
      }),
    ).toBe(true)
  })

  it('does not start reveal early without orbit or timeout', () => {
    expect(
      shouldStartReveal({
        azimuthAccumRad: Math.PI,
        spinElapsedMs: 800,
        loading: false,
        prefersReducedMotion: false,
      }),
    ).toBe(false)
  })

  it('starts reveal immediately under reduced motion once data is ready', () => {
    expect(
      shouldStartReveal({
        azimuthAccumRad: 0,
        spinElapsedMs: 0,
        loading: false,
        prefersReducedMotion: true,
      }),
    ).toBe(true)
  })

  it('uses metallic-gold shader only near pure gold blend', () => {
    expect(shouldUseMetallicGoldShader(0)).toBe(true)
    expect(shouldUseMetallicGoldShader(GLOBE_INTRO.metallicGoldMaxBlend)).toBe(true)
    expect(shouldUseMetallicGoldShader(GLOBE_INTRO.metallicGoldMaxBlend + 0.01)).toBe(false)
    expect(shouldUseMetallicGoldShader(1)).toBe(false)
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
  })

  it('resolveIntroPlateMaterial is gold at 0, tier at 1, mixed in between', () => {
    expect(lerpHex('#000000', '#ffffff', 0.5)).toBe('#808080')

    const base = {
      visualState: 'idle' as const,
      layerId: 'country_select' as const,
      regulatoryTier: 'legal_commercial_access' as const,
    }

    const gold = resolveIntroPlateMaterial({ ...base, blend: 0 })
    const tier = resolveIntroPlateMaterial({ ...base, blend: 1 })
    const mid = resolveIntroPlateMaterial({ ...base, blend: 0.5 })

    expect(gold.metalness).toBeGreaterThan(tier.metalness)
    expect(mid.metalness).toBeCloseTo((gold.metalness + tier.metalness) / 2, 5)
    expect(mid.plateBase).not.toBe(gold.plateBase)
    expect(mid.plateBase).not.toBe(tier.plateBase)
  })
})
