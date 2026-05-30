import type { HarbourviewCountryGeometry } from '@/lib/globe/geojson-country-types'

type EuropePlateSeed = [iso2: string, iso3: string, name: string, centroid: [number, number], bbox: [number, number, number, number]]

const EUROPE_PLATE_SEEDS: EuropePlateSeed[] = [
  ['AD', 'AND', 'Andorra', [1.56, 42.54], [1, 42.2, 2.1, 42.9]],
  ['LI', 'LIE', 'Liechtenstein', [9.55, 47.16], [9.25, 46.95, 9.85, 47.35]],
  ['LU', 'LUX', 'Luxembourg', [6.13, 49.77], [5.65, 49.38, 6.58, 50.22]],
  ['MC', 'MCO', 'Monaco', [7.42, 43.73], [7.15, 43.55, 7.75, 43.95]],
  ['SM', 'SMR', 'San Marino', [12.46, 43.94], [12.15, 43.75, 12.75, 44.15]],
  ['VA', 'VAT', 'Vatican City', [12.45, 41.9], [12.25, 41.75, 12.65, 42.05]],
  ['MT', 'MLT', 'Malta', [14.38, 35.94], [13.8, 35.65, 14.8, 36.25]],
  ['CY', 'CYP', 'Cyprus', [33.22, 35.05], [32.15, 34.45, 34.75, 35.82]],
  ['XK', 'XKX', 'Kosovo', [20.9, 42.58], [20, 41.85, 21.85, 43.3]],
]

function makeEuropePlate([iso2, iso3, name, centroid, bbox]: EuropePlateSeed): HarbourviewCountryGeometry {
  const [minLon, minLat, maxLon, maxLat] = bbox

  return {
    iso2,
    iso3,
    name,
    centroid,
    bbox,
    source: 'natural-earth-compatible-fixture',
    polygons: [{ rings: [{ kind: 'outer', points: [[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]] }] }],
  }
}

// Enlarged presentation plates for European microstates and small-market gaps that disappear at mobile globe scale in the 110m admin-0 payload.
export const europeMicroStatePlates: HarbourviewCountryGeometry[] = EUROPE_PLATE_SEEDS.map(makeEuropePlate)

export const europeMicroStatePlateIso2s = new Set(europeMicroStatePlates.map((entry) => entry.iso2))
