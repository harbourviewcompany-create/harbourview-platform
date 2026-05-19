export type GeoJsonPosition = [number, number] | [number, number, number]

export type GeoJsonLinearRing = GeoJsonPosition[]

export type GeoJsonPolygonCoordinates = GeoJsonLinearRing[]

export type GeoJsonMultiPolygonCoordinates = GeoJsonPolygonCoordinates[]

export interface NaturalEarthCountryProperties {
  ISO_A2?: string
  ISO_A3?: string
  ADM0_A3?: string
  NAME?: string
  NAME_LONG?: string
  ADMIN?: string
  CONTINENT?: string
  REGION_UN?: string
  SUBREGION?: string
  [key: string]: unknown
}

export interface NaturalEarthCountryFeature {
  type: 'Feature'
  properties: NaturalEarthCountryProperties
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: GeoJsonPolygonCoordinates | GeoJsonMultiPolygonCoordinates
  }
}

export interface NaturalEarthCountryFeatureCollection {
  type: 'FeatureCollection'
  features: NaturalEarthCountryFeature[]
}

export interface HarbourviewCountryPolygonRing {
  points: [number, number][]
  kind: 'outer' | 'hole'
}

export interface HarbourviewCountryPolygon {
  rings: HarbourviewCountryPolygonRing[]
}

export interface HarbourviewCountryGeometry {
  iso2: string
  iso3: string
  name: string
  centroid: [number, number]
  bbox: [number, number, number, number]
  polygons: HarbourviewCountryPolygon[]
  source: 'natural-earth-admin-0'
}

export interface HarbourviewCountryGeometryPayload {
  provenance: {
    source: 'Natural Earth Admin 0 Countries'
    sourceScale: '1:110m' | '1:50m' | '1:10m'
    sourceVersion: string
    sourceLicense: 'Public domain'
    boundaryModel: 'Natural Earth de facto boundaries'
    generatedAt: string
    generatedBy: string
    harbourviewTransformVersion: string
  }
  countries: HarbourviewCountryGeometry[]
}
