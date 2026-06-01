import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { getCountryFocusVector } from './globe-geometry'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

export interface GlobeCameraPose {
  position: [number, number, number]
  target: [number, number, number]
}

interface CountryFocusOptions {
  targetDistanceMax?: number
}

const DEFAULT_FOCUS_DISTANCE = 6.2
const DEFAULT_TARGET_DISTANCE = 2.1

const MIN_FOCUS_DISTANCE = 4.4
const MAX_FOCUS_DISTANCE = 6.8
const BBOX_DISTANCE_SLOPE = 0.018

function clamp(value: number, min: number, max: number) {
  if (value < min) return min
  if (value > max) return max
  return value
}

export function bboxFocusDistance(bbox: [number, number, number, number]): number {
  const [minLon, minLat, maxLon, maxLat] = bbox
  const lonSpan = Math.abs(maxLon - minLon)
  const latSpan = Math.abs(maxLat - minLat)
  const extent = Math.max(lonSpan, latSpan)

  return clamp(MIN_FOCUS_DISTANCE + extent * BBOX_DISTANCE_SLOPE, MIN_FOCUS_DISTANCE, MAX_FOCUS_DISTANCE)
}

// Globe group rotation [rx=0.12, ry=-0.8, rz=0] from GlobeCanvas <group rotation={[0.12,-0.8,0]}>.
// Without this the camera targets the country LOCAL position, not WORLD position.
function applyGlobeGroupRotation(x: number, y: number, z: number): [number, number, number] {
  const rx = 0.12, ry = -0.8
  const cx = Math.cos(rx), sx = Math.sin(rx)
  const cy = Math.cos(ry), sy = Math.sin(ry)
  const x1 = x, y1 = y * cx - z * sx, z1 = y * sx + z * cx // Rx
  return [x1 * cy + z1 * sy, y1, -x1 * sy + z1 * cy] // Ry
}

export function createCountryFocusPose(
  country: HarbourviewCountryGeometry,
  options: CountryFocusOptions = {},
): GlobeCameraPose {
  const vector = getCountryFocusVector({
    iso2: country.iso2,
    name: country.name,
    centroid: {
      lon: country.centroid[0],
      lat: country.centroid[1],
    },
    rings: [],
  })

  const focusDistance = country.bbox ? bboxFocusDistance(country.bbox) : DEFAULT_FOCUS_DISTANCE
  const targetDistance = clamp(options.targetDistanceMax ?? DEFAULT_TARGET_DISTANCE, 0.24, DEFAULT_TARGET_DISTANCE)

  const [wx, wy, wz] = applyGlobeGroupRotation(vector.x, vector.y, vector.z)
  return {
    position: [wx * focusDistance, wy * focusDistance, wz * focusDistance],
    target: [wx * targetDistance, wy * targetDistance, wz * targetDistance],
  }
}

export function getInitialCameraPose(): GlobeCameraPose {
  return {
    position: [...GLOBE_CAMERA_CONFIG.initialPosition] as [number, number, number],
    target: [...GLOBE_CAMERA_CONFIG.initialTarget] as [number, number, number],
  }
}

export function easeInOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1)
  if (clamped < 0.5) return 4 * clamped * clamped * clamped
  const inv = 1 - clamped
  return 1 - 4 * inv * inv * inv
}

export function interpolateCameraPose(
  from: GlobeCameraPose,
  to: GlobeCameraPose,
  progress: number,
): GlobeCameraPose {
  const eased = easeInOutCubic(progress)
  const blend = (start: number, end: number) => start + (end - start) * eased

  return {
    position: [
      blend(from.position[0], to.position[0]),
      blend(from.position[1], to.position[1]),
      blend(from.position[2], to.position[2]),
    ],
    target: [
      blend(from.target[0], to.target[0]),
      blend(from.target[1], to.target[1]),
      blend(from.target[2], to.target[2]),
    ],
  }
}
