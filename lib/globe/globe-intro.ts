/**
 * First-paint globe intro: gold plates → timed 360° spin → soft lerp into
 * regulatory tier colouring. Pure helpers shared by Canvas and tests.
 */

import type { GlobeMaterialState } from '@/lib/globe/globe-materials'

export type GlobeIntroPhase = 'spinning' | 'revealing' | 'ready'

export const GLOBE_INTRO = {
  /** Wall-clock duration of the gold 360 spin (ms). */
  spinDurationMs: 2800,
  /** Soft gold → tier colour lerp after spin (ms). */
  revealDurationMs: 750,
  /**
   * OrbitControls autoRotateSpeed for the intro spin.
   * three.js: default 2.0 ≈ 30s/rev at 60fps → speed ≈ 60 / durationSec.
   */
  spinAutoRotateSpeed: 21.5,
  /** Production idle spin after intro. */
  idleAutoRotateSpeed: 0.22,
} as const

/** Ease-out cubic for the colour reveal (fast start, soft settle). */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - x, 3)
}

/**
 * 0 = pure gold plates, 1 = full tier heat map.
 * Reduced motion jumps straight to 1 once data is ready.
 */
export function introTierBlend({
  introPhase,
  revealElapsedMs,
  prefersReducedMotion,
}: {
  introPhase: GlobeIntroPhase
  revealElapsedMs: number
  prefersReducedMotion: boolean
}): number {
  if (prefersReducedMotion) {
    return introPhase === 'spinning' ? 0 : 1
  }
  if (introPhase === 'spinning') return 0
  if (introPhase === 'ready') return 1
  return easeOutCubic(revealElapsedMs / GLOBE_INTRO.revealDurationMs)
}

/**
 * Interaction lock: spin + reveal. Reduced motion only locks while still
 * waiting on the spinning→ready jump (effectively until data is ready).
 */
export function isIntroInteractionLocked({
  introPhase,
  prefersReducedMotion,
}: {
  introPhase: GlobeIntroPhase
  prefersReducedMotion: boolean
}): boolean {
  if (prefersReducedMotion) return introPhase === 'spinning'
  return introPhase !== 'ready'
}

/** True while plates must ignore tiers entirely (pre-reveal). */
export function shouldForceGoldPlates({
  introPhase,
  prefersReducedMotion,
}: {
  introPhase: GlobeIntroPhase
  prefersReducedMotion: boolean
}): boolean {
  if (prefersReducedMotion) return false
  return introPhase === 'spinning'
}

/**
 * Advance spinning → revealing when the timed orbit finished and live data
 * is no longer loading. Reduced motion skips reveal and goes straight ready.
 */
export function shouldStartReveal({
  spinElapsedMs,
  loading,
  prefersReducedMotion,
}: {
  spinElapsedMs: number
  loading: boolean
  prefersReducedMotion: boolean
}): boolean {
  if (loading) return false
  if (prefersReducedMotion) return true
  return spinElapsedMs >= GLOBE_INTRO.spinDurationMs
}

/** Advance revealing → ready after the lerp window. */
export function shouldFinishReveal({
  revealElapsedMs,
  prefersReducedMotion,
}: {
  revealElapsedMs: number
  prefersReducedMotion: boolean
}): boolean {
  if (prefersReducedMotion) return true
  return revealElapsedMs >= GLOBE_INTRO.revealDurationMs
}

/** @deprecated use shouldStartReveal */
export const shouldCompleteIntro = shouldStartReveal

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.padEnd(6, '0').slice(0, 6)
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ]
}

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.round(Math.min(1, Math.max(0, n)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  const x = Math.min(1, Math.max(0, t))
  return toHex(ar + (br - ar) * x, ag + (bg - ag) * x, ab + (bb - ab) * x)
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Blend two plate material states for the intro reveal. */
export function lerpGlobeMaterialState(
  from: GlobeMaterialState,
  to: GlobeMaterialState,
  t: number,
): GlobeMaterialState {
  const x = Math.min(1, Math.max(0, t))
  if (x <= 0) return from
  if (x >= 1) return to
  return {
    oceanBase: lerpHex(from.oceanBase, to.oceanBase, x),
    plateBase: lerpHex(from.plateBase, to.plateBase, x),
    borderColor: lerpHex(from.borderColor, to.borderColor, x),
    emissive: lerpHex(from.emissive, to.emissive, x),
    emissiveIntensity: lerpNum(from.emissiveIntensity, to.emissiveIntensity, x),
    roughness: lerpNum(from.roughness, to.roughness, x),
    metalness: lerpNum(from.metalness, to.metalness, x),
    clearcoat: lerpNum(from.clearcoat, to.clearcoat, x),
    clearcoatRoughness: lerpNum(from.clearcoatRoughness, to.clearcoatRoughness, x),
    sidewallColor: lerpHex(from.sidewallColor, to.sidewallColor, x),
  }
}
