export type GeoJsonPosition = [number, number] | [number, number, number]

export type GeoJsonLinearRing = GeoJsonPosition[]

export type GeoJsonPolygonCoordinates = GeoJsonLinearRing[]

export type GeoJsonMultiPolygonCoordinates = GeoJsonPolygonCoordinates[]

export interface NaturalEarthCountryProperties {
  ISO_A2?: string
  /** ISO 3166-1 alpha-2 with overseas territories included (corrects -99 in ISO_A2 for France, Norway, etc.) */
  ISO_A2_EH?: string
  ISO_A3?: string
  /** ISO 3166-1 alpha-3 with overseas territories included */
  ISO_A3_EH?: string
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
  source: 'natural-earth-admin-0' | 'natural-earth-compatible-fixture'
}

export interface HarbourviewCountryGeometryPayload {
  provenance: {
    source: 'Natural Earth Admin 0 Countries' | 'Natural Earth-compatible fixture'
    sourceScale: '1:110m' | '1:50m' | '1:10m' | 'fixture'
    sourceVersion: string
    sourceLicense: 'Public domain' | 'Internal fixture only'
    boundaryModel: 'Natural Earth de facto boundaries' | 'Non-authoritative simplified fixture boundaries'
    generatedAt: string
    generatedBy: string
    harbourviewTransformVersion: string
    fixtureOnly?: boolean
    productionDataRequired?: boolean
    notes?: string
  }
  countries: HarbourviewCountryGeometry[]
}

