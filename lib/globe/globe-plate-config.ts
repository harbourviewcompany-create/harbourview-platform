/**
 * Canonical plate-geometry heights.
 *
 * Single source of truth shared between CountryPolygonMeshLayer and
 * CountryBorderLayer so the border offset is always exactly at the idle
 * plate surface — never drifting as extrusion values are tuned.
 *
 *   Idle plate top   = GLOBE_RADIUS + PLATE_LIFT + IDLE_EXTRUSION     = +0.084
 *   Selected plate top = GLOBE_RADIUS + PLATE_LIFT + 0.002 + SELECTED  = +0.122
 *
 * BORDER_OFFSET sits 0.002 above the idle plate top (+0.086). The 0.002
 * is the minimum z-fight clearance — it is invisible at any camera distance
 * used by the globe. It is NOT a design gap.
 *
 * When a plate is selected it rises to +0.122, above the border line at +0.086,
 * so the selected plate mesh naturally covers the border within its footprint.
 * That is correct cartographic behaviour: the filled plate is the primary signal;
 * the border is surface detail on idle plates.
 */

export const PLATE_LIFT        = 0.026
export const IDLE_EXTRUSION    = 0.058
export const SELECTED_EXTRUSION = 0.094

/** Offset of idle plate tops from GLOBE_RADIUS */
export const IDLE_PLATE_TOP_OFFSET = PLATE_LIFT + IDLE_EXTRUSION            // 0.084

/** Border lines ride exactly at idle plate surface + z-fight epsilon */
export const BORDER_OFFSET         = PLATE_LIFT + IDLE_EXTRUSION + 0.002    // 0.086
