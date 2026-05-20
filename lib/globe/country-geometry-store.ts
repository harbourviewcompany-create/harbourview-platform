import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

export function getGlobeCountryGeometries(): HarbourviewCountryGeometry[] {
  return naturalEarthFixturePayload.countries
}

export function getGlobeCountryGeometry(iso2?: string) {
  if (!iso2) return undefined

  return naturalEarthFixturePayload.countries.find((country) => country.iso2 === iso2)
}

export function getGlobeCountryGeometryProvenance() {
  return naturalEarthFixturePayload.provenance
}
