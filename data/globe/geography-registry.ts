import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { europeMicroStatePlates, europeMicroStatePlateIso2s } from '@/data/globe/europe-microstate-plates'
import type { HarbourviewCountryGeometry } from '@/lib/globe/geojson-country-types'

const replacedIso2s = new Set<string>(['CA', 'US'])
europeMicroStatePlateIso2s.forEach((iso2) => replacedIso2s.add(iso2))

const admin0Countries = naturalEarthCountriesPayload.countries.filter((entry) => !replacedIso2s.has(entry.iso2))

export const globeGeographyEntries: HarbourviewCountryGeometry[] = admin0Countries.concat(
  europeMicroStatePlates,
  canadaProvinces,
  usStates,
)

export const globeGeographyByIso2 = Object.fromEntries(
  globeGeographyEntries.map((entry) => [entry.iso2, entry]),
) as Record<string, HarbourviewCountryGeometry>

export const globeChildIso2sByParentIso2: Record<string, string[]> = {
  CA: canadaProvinces.map((province) => province.iso2),
  US: usStates.map((state) => state.iso2),
}

export function getGlobeChildIso2s(parentIso2: string): string[] {
  return globeChildIso2sByParentIso2[parentIso2] ?? []
}
