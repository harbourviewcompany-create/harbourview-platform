/**
 * Canonical plate-geometry heights + LOD thresholds.
 *
 * Single source of truth shared between geometry generation,
 * performance tiers, and reduced-motion.
 */

export const PLATE_LIFT        = 0.026
export const IDLE_EXTRUSION    = 0.058
export const SELECTED_EXTRUSION = 0.094

export const IDLE_PLATE_TOP_OFFSET = PLATE_LIFT + IDLE_EXTRUSION

export const BORDER_OFFSET         = PLATE_LIFT + IDLE_EXTRUSION + 0.006

export const SELECTED_GLOW = '#c89820'

// LOD Simplification thresholds (Douglas-Peucker tolerance in degrees)
export const LOD_SIMPLIFY_TOLERANCE = {
  high: 0.0,      // Full detail for selected/focused countries
  medium: 0.04,   // Balanced for idle on medium perf
  low: 0.12,      // Aggressive for reduced-motion / low-end
} as const

export type LODLevel = keyof typeof LOD_SIMPLIFY_TOLERANCE

export type SimplifyTolerance = typeof LOD_SIMPLIFY_TOLERANCE[LODLevel]
