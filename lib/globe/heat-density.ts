/**
 * lib/globe/heat-density.ts
 *
 * Builds an equirectangular density texture from GlobeCountryMarker[] + signals.
 * Uses spherical Gaussian kernels (great-arc via haversine).
 *
 * Intended for infrequent updates (data load / throttled realtime), not per-frame.
 * Default resolution is 512×256 for main-thread safety; raise to 1024×512 once
 * validated on target devices.
 */

import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'
import { PLATE_LIFT, IDLE_EXTRUSION } from '@/lib/globe/globe-plate-config'

export const HEAT_CONFIG = {
  /** Equirectangular resolution. 512×256 keeps first paint fast on main thread. */
  width: 512,
  height: 256,

  /** Angular bandwidth of each Gaussian kernel (degrees). */
  bandwidthDeg: 3.2,

  /** Max altitude of heat surface above plate top (world units). */
  maxAltitude: 0.14,

  /** Plate-surface radius — must stay in sync with DataVizLayer / plates. */
  surfaceRadius: 2.35 + PLATE_LIFT + IDLE_EXTRUSION,

  /** Soft floor so zero-activity areas stay almost invisible. */
  densityFloor: 0.04,

  /** Saturation multiplier before color mapping (dampens outliers). */
  saturation: 0.85,
} as const

export type HeatPoint = {
  lat: number
  lng: number
  weight: number
}

/**
 * Convert live data into weighted points.
 * weight = max(opportunityScore/100, signalCount/10) clamped 0–1.
 */
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

/** Great-arc angular distance in degrees (haversine). */
function angularDistanceDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2
  return (2 * Math.asin(Math.min(1, Math.sqrt(a))) * 180) / Math.PI
}

/**
 * Generate a single-channel density field (Float32, 0–1).
 * Length = width * height.
 */
export function computeDensityField(
  points: HeatPoint[],
  width = HEAT_CONFIG.width,
  height = HEAT_CONFIG.height,
  bandwidthDeg = HEAT_CONFIG.bandwidthDeg,
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
        const g = invNorm * Math.exp(-(d * d) / twoSigmaSq)
        sum += g * p.weight
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

/** Pack Float32 density into Uint8Array for DataTexture (R channel). */
export function densityToUint8(field: Float32Array): Uint8Array {
  const out = new Uint8Array(field.length)
  for (let i = 0; i < field.length; i++) {
    out[i] = Math.round(Math.min(1, Math.max(0, field[i])) * 255)
  }
  return out
}
