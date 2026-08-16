/**
 * First-paint globe intro: force gold plates, one timed 360° spin, then enable
 * regulatory tier colouring. Kept pure so Canvas and tests can share timing.
 */

export type GlobeIntroPhase = 'spinning' | 'ready'

export const GLOBE_INTRO = {
  /** Wall-clock duration of the gold 360 spin (ms). */
  spinDurationMs: 2800,
  /**
   * OrbitControls autoRotateSpeed for the intro spin.
   * three.js: default 2.0 ≈ 30s/rev at 60fps → speed ≈ 60 / durationSec.
   */
  spinAutoRotateSpeed: 21.5,
  /** Production idle spin after intro. */
  idleAutoRotateSpeed: 0.22,
} as const

/**
 * Whether the intro is still locking gold plates (no tier heat map yet).
 * Reduced-motion callers should pass prefersReducedMotion=true so they skip
 * the spin and unlock as soon as data is ready.
 */
export function shouldForceGoldPlates({
  introPhase,
  prefersReducedMotion,
}: {
  introPhase: GlobeIntroPhase
  prefersReducedMotion: boolean
}): boolean {
  if (prefersReducedMotion) return false
  return introPhase !== 'ready'
}

/**
 * Advance from spinning → ready when the timed orbit finished and live data
 * is no longer loading. If loading is still true after the spin window, the
 * caller keeps force-gold until loading clears, then flips to ready.
 */
export function shouldCompleteIntro({
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
