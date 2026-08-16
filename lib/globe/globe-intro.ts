/**
 * First-paint globe intro: gold → full azimuth orbit → soft lerp into tiers.
 *
 * Phase machine lives in GlobeCanvas / CSS fallback. This module holds timing
 * constants and pure helpers so unit tests stay free of R3F.
 */

import {
  resolveCountryMaterialState,
  type GlobeCountryVisualState,
  type GlobeMaterialState,
  type GlobeTierPalette,
  type RegulatoryTier,
} from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

export type GlobeIntroPhase = 'spinning' | 'revealing' | 'ready'

export const GLOBE_INTRO = {
  /** Expected gold orbit duration (ms) at spinAutoRotateSpeed — docs / CSS fallback. */
  spinDurationMs: 2800,
  /** Hard cap if azimuth tracking never completes (ms). */
  spinMaxDurationMs: 5200,
  /** One full turn in radians (OrbitControls azimuth). */
  fullOrbitRad: Math.PI * 2,
  /** Gold → tier material lerp after spin (ms). */
  revealDurationMs: 750,
  /**
   * OrbitControls autoRotateSpeed during spin.
   * three.js: speed 2 ≈ 30s/rev at 60fps → ~60 / durationSec for one turn.
   */
  spinAutoRotateSpeed: 21.5,
  /** Idle auto-rotate after intro. */
  idleAutoRotateSpeed: 0.22,
  /**
   * Above this introTierBlend, drop the metallic-gold onBeforeCompile path so
   * tier colours are not re-tinted toward gold mid-reveal.
   */
  metallicGoldMaxBlend: 0.05,
} as const

function clamp01(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}

export function introTierBlend({
  introPhase,
  revealElapsedMs,
  prefersReducedMotion,
}: {
  introPhase: GlobeIntroPhase
  revealElapsedMs: number
  prefersReducedMotion: boolean
}): number {
  if (prefersReducedMotion) return introPhase === 'spinning' ? 0 : 1
  if (introPhase === 'spinning') return 0
  if (introPhase === 'ready') return 1
  return easeOutCubic(revealElapsedMs / GLOBE_INTRO.revealDurationMs)
}

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
 * True while the brushed metallic-gold shader should own diffuseColour.
 * Once the heat map starts fading in, plain PBR uses the lerped plate colour.
 */
export function shouldUseMetallicGoldShader(blend: number): boolean {
  return clamp01(blend) <= GLOBE_INTRO.metallicGoldMaxBlend
}

/**
 * Start reveal after one measured azimuth orbit (or safety timeout), and only
 * once live data is no longer loading.
 */
export function shouldStartReveal({
  azimuthAccumRad,
  spinElapsedMs,
  loading,
  prefersReducedMotion,
}: {
  azimuthAccumRad: number
  spinElapsedMs: number
  loading: boolean
  prefersReducedMotion: boolean
}): boolean {
  if (loading) return false
  if (prefersReducedMotion) return true
  const fullOrbit = azimuthAccumRad >= GLOBE_INTRO.fullOrbitRad * 0.98
  const timedOut = spinElapsedMs >= GLOBE_INTRO.spinMaxDurationMs
  return fullOrbit || timedOut
}

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

/** @deprecated Prefer shouldStartReveal. */
export const shouldCompleteIntro = shouldStartReveal

function parseHexRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6)
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ]
}

function formatHexRgb(r: number, g: number, b: number): string {
  const byte = (n: number) =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

export function lerpHex(from: string, to: string, t: number): string {
  const x = clamp01(t)
  const [fr, fg, fb] = parseHexRgb(from)
  const [tr, tg, tb] = parseHexRgb(to)
  return formatHexRgb(lerp(fr, tr, x), lerp(fg, tg, x), lerp(fb, tb, x))
}

export function lerpGlobeMaterialState(
  from: GlobeMaterialState,
  to: GlobeMaterialState,
  t: number,
): GlobeMaterialState {
  const x = clamp01(t)
  if (x === 0) return from
  if (x === 1) return to

  return {
    oceanBase: lerpHex(from.oceanBase, to.oceanBase, x),
    plateBase: lerpHex(from.plateBase, to.plateBase, x),
    borderColor: lerpHex(from.borderColor, to.borderColor, x),
    emissive: lerpHex(from.emissive, to.emissive, x),
    emissiveIntensity: lerp(from.emissiveIntensity, to.emissiveIntensity, x),
    roughness: lerp(from.roughness, to.roughness, x),
    metalness: lerp(from.metalness, to.metalness, x),
    clearcoat: lerp(from.clearcoat, to.clearcoat, x),
    clearcoatRoughness: lerp(from.clearcoatRoughness, to.clearcoatRoughness, x),
    sidewallColor: lerpHex(from.sidewallColor, to.sidewallColor, x),
  }
}

export function resolveIntroPlateMaterial({
  visualState,
  layerId,
  regulatoryTier = null,
  palette = 'metal',
  blend,
}: {
  visualState: GlobeCountryVisualState
  layerId: GlobeLayerId
  regulatoryTier?: RegulatoryTier | null
  palette?: GlobeTierPalette
  blend: number
}): GlobeMaterialState {
  const t = clamp01(blend)

  const gold = resolveCountryMaterialState({
    visualState,
    layerId,
    regulatoryTier: null,
    palette,
  })

  if (t === 0) return gold

  const tiered = resolveCountryMaterialState({
    visualState,
    layerId,
    regulatoryTier,
    palette,
  })

  if (t === 1) return tiered
  return lerpGlobeMaterialState(gold, tiered, t)
}
