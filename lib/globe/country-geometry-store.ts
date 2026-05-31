import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import type { HarbourviewCountryGeometry } from './geojson-country-types'

export function getGlobeCountryGeometries(): HarbourviewCountryGeometry[] {
  return naturalEarthCountriesPayload.countries
}

export function getGlobeCountryGeometry(iso2?: string) {
  if (!iso2) return undefined

  return naturalEarthCountriesPayload.countries.find((country) => country.iso2 === iso2)
}

export function getGlobeCountryGeometryProvenance() {
  return naturalEarthCountriesPayload.provenance
}
