import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { getCountryFocusVector } from './globe-geometry'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

export interface GlobeCameraPose {
  position: [number, number, number]
  target: [number, number, number]
}

const DEFAULT_FOCUS_DISTANCE = 5.6
const DEFAULT_TARGET_DISTANCE_RATIO = 0.34

const MIN_FOCUS_DISTANCE = 5.2
const MAX_FOCUS_DISTANCE = 5.9
const BBOX_DISTANCE_SLOPE = 0.009
const MIN_CAMERA_TARGET_SEPARATION = 2.8
const MAX_TARGET_DISTANCE_RATIO = 0.45

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

export function createCountryFocusPose(country: HarbourviewCountryGeometry): GlobeCameraPose {
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
  const unclampedTargetDistance = focusDistance * DEFAULT_TARGET_DISTANCE_RATIO
  const maxTargetDistanceFromSeparation = focusDistance - MIN_CAMERA_TARGET_SEPARATION
  const maxTargetDistanceFromRatio = focusDistance * MAX_TARGET_DISTANCE_RATIO
  const targetDistance = clamp(
    unclampedTargetDistance,
    0,
    Math.min(maxTargetDistanceFromSeparation, maxTargetDistanceFromRatio),
  )

  return {
    position: [vector.x * focusDistance, vector.y * focusDistance, vector.z * focusDistance],
    target: [vector.x * targetDistance, vector.y * targetDistance, vector.z * targetDistance],
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
