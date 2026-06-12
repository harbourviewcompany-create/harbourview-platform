/**
 * Canonical plate-geometry heights + LOD thresholds.
 *
 * Single source of truth for geometry generation, performance tiers,
 * reduced-motion handling, and Douglas-Peucker simplification.
 * All values are in world units (globe radius ~2.35).
 */

export const PLATE_LIFT        = 0.026
export const IDLE_EXTRUSION    = 0.058
export const SELECTED_EXTRUSION = 0.094

export const IDLE_PLATE_TOP_OFFSET = PLATE_LIFT + IDLE_EXTRUSION

export const BORDER_OFFSET         = PLATE_LIFT + IDLE_EXTRUSION + 0.006

export const SELECTED_GLOW = '#c89820'

/**
 * LOD Simplification thresholds using Douglas-Peucker algorithm (tolerance in degrees).
 * Higher tolerance = more aggressive vertex reduction for background countries.
 */
export const LOD_SIMPLIFY_TOLERANCE = {
  high: 0.0,      // No simplification — full detail for selected/focused countries
  medium: 0.04,   // Moderate reduction for idle countries on medium performance
  low: 0.12,      // Aggressive reduction for reduced-motion or low-end devices
} as const

export type LODLevel = keyof typeof LOD_SIMPLIFY_TOLERANCE
export type SimplifyTolerance = typeof LOD_SIMPLIFY_TOLERANCE[LODLevel]

/**
 * Globe group rotation applied in GlobeCanvas (<group rotation={[rx, ry, 0]}>).
 * Exported so CameraFlyToController and any future consumers stay in sync
 * without hardcoding the same magic numbers in multiple places.
 */
export const GLOBE_GROUP_ROTATION = { rx: 0.08, ry: 0.3 } as const
