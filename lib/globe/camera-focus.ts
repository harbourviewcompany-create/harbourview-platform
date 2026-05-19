import { getCountryFocusVector } from './globe-geometry'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

export interface GlobeCameraPose {
  position: [number, number, number]
  target: [number, number, number]
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

  return {
    position: [vector.x * 6.2, vector.y * 6.2, vector.z * 6.2],
    target: [vector.x * 2.1, vector.y * 2.1, vector.z * 2.1],
  }
}

export function interpolateCameraPose(
  from: GlobeCameraPose,
  to: GlobeCameraPose,
  progress: number,
): GlobeCameraPose {
  const blend = (start: number, end: number) => start + (end - start) * progress

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
