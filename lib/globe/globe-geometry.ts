import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'

export const GLOBE_RADIUS = 2.35
export const COUNTRY_PLATE_OFFSET = 0.026
export const BORDER_OFFSET = 0.036
export const SELECTED_PLATE_OFFSET = 0.052

export interface GlobeVector3 {
  x: number
  y: number
  z: number
}

export interface GlobeRingPoint {
  lon: number
  lat: number
}

export interface GlobeCountryRing {
  points: GlobeRingPoint[]
}

export interface GlobeCountryGeometryFeature {
  iso2: string
  name: string
  centroid: GlobeRingPoint
  rings: GlobeCountryRing[]
}

export function lonLatToVector3(lon: number, lat: number, radius = GLOBE_RADIUS): GlobeVector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

export function normalizeVector3(vector: GlobeVector3): GlobeVector3 {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2)

  if (length === 0) return { x: 0, y: 0, z: 0 }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

export function vector3ToArray(vector: GlobeVector3): [number, number, number] {
  return [vector.x, vector.y, vector.z]
}

export function buildFixtureCountryFeatures(): GlobeCountryGeometryFeature[] {
  return naturalEarthCountriesPayload.countries.map((country) => {
    const firstPolygon = country.polygons[0]

    return {
      iso2: country.iso2,
      name: country.name,
      centroid: {
        lon: country.centroid[0],
        lat: country.centroid[1],
      },
      rings: firstPolygon
        ? firstPolygon.rings.map((ring) => ({
            points: ring.points.map((point) => ({ lon: point[0], lat: point[1] })),
          }))
        : [],
    }
  })
}

export function projectRingToSphere(ring: GlobeCountryRing, radius = GLOBE_RADIUS + COUNTRY_PLATE_OFFSET) {
  return ring.points.map((point) => lonLatToVector3(point.lon, point.lat, radius))
}

export function getCountryFocusVector(feature: GlobeCountryGeometryFeature) {
  return normalizeVector3(lonLatToVector3(feature.centroid.lon, feature.centroid.lat, GLOBE_RADIUS))
}
