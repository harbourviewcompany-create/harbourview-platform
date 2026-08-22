/**
 * lib/globe/heat-density.ts
 *
 * Spherical Gaussian KDE for the globe heat overlay.
 * Heavy compute is intended to run in heat-density.worker.ts; this module
 * remains the shared pure API for tests and main-thread fallback.
 */

import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'
import { PLATE_LIFT, IDLE_EXTRUSION } from '@/lib/globe/globe-plate-config'

export type HeatQuality = 'full' | 'medium' | 'low'

export const HEAT_RESOLUTION: Record<
  HeatQuality,
  { width: number; height: number; segmentsW: number; segmentsH: number }
> = {
  full: { width: 1024, height: 512, segmentsW: 96, segmentsH: 64 },
  medium: { width: 512, height: 256, segmentsW: 64, segmentsH: 48 },
  low: { width: 256, height: 128, segmentsW: 48, segmentsH: 32 },
}

/** Min ms between density rebuilds on realtime churn. */
export const HEAT_REBUILD_THROTTLE_MS = 1500

export const HEAT_CONFIG = {
  defaultQuality: 'medium' as HeatQuality,
  bandwidthDeg: 3.2,
  maxAltitude: 0.14,
  surfaceRadius: 2.35 + PLATE_LIFT + IDLE_EXTRUSION,
  densityFloor: 0.04,
  saturation: 0.85,
} as const

export type HeatPoint = {
  lat: number
  lng: number
  weight: number
}

export function buildHeatPoints(
  countries: GlobeCountryMarker[],
  signalsByIso2: Record<string, GlobeSignal[]>,
): HeatPoint[] {
  return countries
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map((c) => {
      const signalCount = signalsByIso2[c.iso2]?.length ?? 0
      const opportunityFrac = Math.min((c.opportunityScore ?? 0) / 100, 1)
      const activityFrac = Math.min(signalCount / 10, 1)
      const weight = Math.max(opportunityFrac, activityFrac)
      return { lat: c.lat, lng: c.lng, weight }
    })
    .filter((p) => p.weight > 0.02)
}

/** Stable fingerprint so identical weight sets skip rebuild. */
export function heatPointsFingerprint(points: HeatPoint[]): string {
  if (points.length === 0) return 'empty'
  // Quantize to avoid float noise thrashing the throttle key
  return points
    .map((p) => `${p.lat.toFixed(2)},${p.lng.toFixed(2)},${p.weight.toFixed(3)}`)
    .sort()
    .join('|')
}

export function meanTopHeat(points: HeatPoint[]): number {
  if (points.length === 0) return 0
  const weights = points.map((p) => p.weight).sort((a, b) => b - a)
  const n = Math.max(1, Math.ceil(weights.length * 0.25))
  let sum = 0
  for (let i = 0; i < n; i++) sum += weights[i]
  return Math.min(1, sum / n)
}

function angularDistanceDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2
  return (2 * Math.asin(Math.min(1, Math.sqrt(a))) * 180) / Math.PI
}

export function computeDensityField(
  points: HeatPoint[],
  width: number,
  height: number,
  bandwidthDeg: number = HEAT_CONFIG.bandwidthDeg,
): Float32Array {
  const field = new Float32Array(width * height)
  if (points.length === 0) return field

  const sigma = bandwidthDeg
  const twoSigmaSq = 2 * sigma * sigma
  const invNorm = 1 / (sigma * Math.sqrt(2 * Math.PI))
  const cutoff = sigma * 4

  for (let y = 0; y < height; y++) {
    const lat = 90 - (y / Math.max(1, height - 1)) * 180
    for (let x = 0; x < width; x++) {
      const lng = (x / Math.max(1, width - 1)) * 360 - 180
      let sum = 0
      for (const p of points) {
        const d = angularDistanceDeg(lat, lng, p.lat, p.lng)
        if (d > cutoff) continue
        sum += invNorm * Math.exp(-(d * d) / twoSigmaSq) * p.weight
      }
      field[y * width + x] = sum
    }
  }

  let max = 0
  for (let i = 0; i < field.length; i++) max = Math.max(max, field[i])
  if (max > 0) {
    const inv = HEAT_CONFIG.saturation / max
    for (let i = 0; i < field.length; i++) {
      field[i] = Math.min(1, field[i] * inv)
    }
  }

  return field
}

export function densityToUint8(field: Float32Array, out?: Uint8Array): Uint8Array {
  const dest = out && out.length === field.length ? out : new Uint8Array(field.length)
  for (let i = 0; i < field.length; i++) {
    dest[i] = Math.round(Math.min(1, Math.max(0, field[i])) * 255)
  }
  return dest
}

/**
 * Align with GlobeSameScreenRouterLanding performance protection:
 * cores <= 2 or deviceMemory <= 2 → low (landing would use static fallback;
 * if interactive path still mounts, heat must stay cheapest).
 */
export function resolveHeatQuality(opts: {
  prefersReducedMotion: boolean
  forceLow?: boolean
}): HeatQuality {
  if (opts.prefersReducedMotion || opts.forceLow) return 'low'

  if (typeof navigator !== 'undefined') {
    const cores = navigator.hardwareConcurrency ?? 4
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    if (cores <= 2 || mem <= 2) return 'low'
    if (cores <= 4 || mem <= 4) return 'medium'
  }

  return HEAT_CONFIG.defaultQuality
}
