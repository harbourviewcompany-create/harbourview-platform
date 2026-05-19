import type {
  GeoJsonPolygonCoordinates,
  GeoJsonMultiPolygonCoordinates,
  HarbourviewCountryGeometry,
  HarbourviewCountryGeometryPayload,
  NaturalEarthCountryFeature,
  NaturalEarthCountryFeatureCollection,
} from './geojson-country-types'

function extractIso2(feature: NaturalEarthCountryFeature) {
  return feature.properties.ISO_A2 ?? feature.properties.ADM0_A3?.slice(0, 2) ?? 'XX'
}

function extractIso3(feature: NaturalEarthCountryFeature) {
  return feature.properties.ISO_A3 ?? feature.properties.ADM0_A3 ?? 'XXX'
}

function extractName(feature: NaturalEarthCountryFeature) {
  return feature.properties.NAME_LONG ?? feature.properties.NAME ?? feature.properties.ADMIN ?? 'Unknown'
}

function isPolygonCoordinates(
  coordinates: GeoJsonPolygonCoordinates | GeoJsonMultiPolygonCoordinates,
): coordinates is GeoJsonPolygonCoordinates {
  return typeof coordinates[0]?.[0]?.[0] === 'number'
}

function flattenPolygonCoordinates(coordinates: GeoJsonPolygonCoordinates | GeoJsonMultiPolygonCoordinates) {
  if (isPolygonCoordinates(coordinates)) {
    return [coordinates]
  }

  return coordinates
}

function calculateBoundingBox(points: [number, number][]) {
  if (points.length === 0) return [0, 0, 0, 0] as [number, number, number, number]

  const lons = points.map((point) => point[0])
  const lats = points.map((point) => point[1])

  return [
    Math.min(...lons),
    Math.min(...lats),
    Math.max(...lons),
    Math.max(...lats),
  ] as [number, number, number, number]
}

function calculateCentroid(points: [number, number][]) {
  if (points.length === 0) return [0, 0] as [number, number]

  const sum = points.reduce(
    (accumulator, point) => {
      accumulator.lon += point[0]
      accumulator.lat += point[1]
      return accumulator
    },
    { lon: 0, lat: 0 },
  )

  return [sum.lon / points.length, sum.lat / points.length] as [number, number]
}

export function transformNaturalEarthCountries(
  collection: NaturalEarthCountryFeatureCollection,
): HarbourviewCountryGeometryPayload {
  const countries: HarbourviewCountryGeometry[] = collection.features.map((feature) => {
    const polygons = flattenPolygonCoordinates(feature.geometry.coordinates).map((polygon) => ({
      rings: polygon.map((ring, index) => ({
        kind: index === 0 ? 'outer' as const : 'hole' as const,
        points: ring.map((point) => [point[0], point[1]] as [number, number]),
      })),
    }))

    const allPoints = polygons.flatMap((polygon) => polygon.rings.flatMap((ring) => ring.points))

    return {
      iso2: extractIso2(feature),
      iso3: extractIso3(feature),
      name: extractName(feature),
      centroid: calculateCentroid(allPoints),
      bbox: calculateBoundingBox(allPoints),
      polygons,
      source: 'natural-earth-admin-0',
    }
  })

  return {
    provenance: {
      source: 'Natural Earth Admin 0 Countries',
      sourceScale: '1:110m',
      sourceVersion: 'scaffold-v1',
      sourceLicense: 'Public domain',
      boundaryModel: 'Natural Earth de facto boundaries',
      generatedAt: new Date().toISOString(),
      generatedBy: 'harbourview-globe-transform',
      harbourviewTransformVersion: '0.1.0-scaffold',
    },
    countries,
  }
}

export const naturalEarthIngestionInternals = {
  flattenPolygonCoordinates,
  calculateBoundingBox,
  calculateCentroid,
}
