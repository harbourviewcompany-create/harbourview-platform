import { canadaProvinces } from '@/data/globe/canada-provinces'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import type { HarbourviewCountryGeometry } from './geojson-country-types'
import type { GlobeRenderableKind } from './globe-visual-state'

export type RenderableGlobeEntry = HarbourviewCountryGeometry & {
  parentIso2?: string
}

export const renderableGlobeEntries: RenderableGlobeEntry[] = [
  ...naturalEarthCountriesPayload.countries.filter((country) => country.iso2 !== 'CA'),
  ...canadaProvinces,
]

export const canadaProvinceIso2s = canadaProvinces.map((province) => province.iso2)

export function isSubdivisionEntry(entry: RenderableGlobeEntry): boolean {
  return Boolean(entry.parentIso2)
}

export function getRenderableEntryKind(entry: RenderableGlobeEntry): GlobeRenderableKind {
  return isSubdivisionEntry(entry) ? 'admin1' : 'country'
}

export function entryMatchesCountryOrParent(entry: RenderableGlobeEntry, iso2?: string): boolean {
  if (!iso2) return false
  return entry.iso2 === iso2 || entry.parentIso2 === iso2
}

export function expandSelectedGlobeSet(
  selectedCountryIso2?: string,
  selectedCountryIso2s: string[] = [],
): Set<string> {
  const selectedSet = new Set<string>()

  if (selectedCountryIso2) {
    selectedSet.add(selectedCountryIso2)
  }

  for (const countryIso2 of selectedCountryIso2s) {
    selectedSet.add(countryIso2)
  }

  if (selectedSet.has('CA')) {
    for (const provinceIso2 of canadaProvinceIso2s) {
      selectedSet.add(provinceIso2)
    }
  }

  return selectedSet
}

export function isRenderableEntrySelected(
  entry: RenderableGlobeEntry,
  selectedSet: Set<string>,
): boolean {
  return selectedSet.has(entry.iso2) || Boolean(entry.parentIso2 && selectedSet.has(entry.parentIso2))
}
