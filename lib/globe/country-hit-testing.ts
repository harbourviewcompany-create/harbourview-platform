import type { ThreeEvent } from '@react-three/fiber'

export interface GlobeCountryHit {
  iso2: string
  iso3: string
  distance: number
  point: [number, number, number]
}

export function extractCountryHit(
  event: Pick<ThreeEvent<PointerEvent>, 'distance' | 'point' | 'object'>,
): GlobeCountryHit | null {
  const iso2 = event.object.userData?.iso2
  const iso3 = event.object.userData?.iso3

  if (!iso2 || !iso3) return null

  return {
    iso2,
    iso3,
    distance: event.distance,
    point: [event.point.x, event.point.y, event.point.z],
  }
}

export function shouldPromoteHoverToFocus({
  movementDelta,
  elapsedMs,
}: {
  movementDelta: number
  elapsedMs: number
}) {
  return movementDelta < 12 && elapsedMs > 48
}
