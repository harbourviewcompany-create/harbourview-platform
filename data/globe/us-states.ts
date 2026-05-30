import type { HarbourviewCountryGeometry } from '@/lib/globe/geojson-country-types'

type UsStateGeometry = HarbourviewCountryGeometry & { parentIso2: 'US' }

type UsStateSeed = [iso2: string, iso3: string, name: string, centroid: [number, number], bbox: [number, number, number, number]]

const US_STATE_SEEDS: UsStateSeed[] = [
  ['US-AL', 'USA-AL', 'Alabama', [-86.8, 32.8], [-88.47, 30.22, -84.89, 35.01]],
  ['US-AK', 'USA-AK', 'Alaska', [-152, 64], [-170, 51.2, -130, 71.4]],
  ['US-AZ', 'USA-AZ', 'Arizona', [-111.7, 34.2], [-114.82, 31.33, -109.05, 37]],
  ['US-AR', 'USA-AR', 'Arkansas', [-92.4, 34.9], [-94.62, 33, -89.64, 36.5]],
  ['US-CA', 'USA-CA', 'California', [-119.5, 37.2], [-124.48, 32.53, -114.13, 42.01]],
  ['US-CO', 'USA-CO', 'Colorado', [-105.5, 39], [-109.06, 36.99, -102.04, 41]],
  ['US-CT', 'USA-CT', 'Connecticut', [-72.7, 41.6], [-73.73, 40.98, -71.79, 42.05]],
  ['US-DE', 'USA-DE', 'Delaware', [-75.5, 39], [-75.79, 38.45, -75.05, 39.84]],
  ['US-DC', 'USA-DC', 'District of Columbia', [-77.04, 38.9], [-77.12, 38.79, -76.91, 38.995]],
  ['US-FL', 'USA-FL', 'Florida', [-82.5, 28.5], [-87.64, 24.52, -80.03, 31]],
  ['US-GA', 'USA-GA', 'Georgia', [-83.3, 32.7], [-85.61, 30.36, -80.84, 35]],
  ['US-HI', 'USA-HI', 'Hawaii', [-157.5, 20.9], [-160.25, 18.9, -154.8, 22.3]],
  ['US-ID', 'USA-ID', 'Idaho', [-114.4, 44.4], [-117.24, 42, -111.04, 49]],
  ['US-IL', 'USA-IL', 'Illinois', [-89.2, 40], [-91.51, 36.97, -87.02, 42.51]],
  ['US-IN', 'USA-IN', 'Indiana', [-86.2, 39.9], [-88.1, 37.77, -84.78, 41.76]],
  ['US-IA', 'USA-IA', 'Iowa', [-93.4, 42], [-96.64, 40.37, -90.14, 43.5]],
  ['US-KS', 'USA-KS', 'Kansas', [-98.3, 38.5], [-102.05, 36.99, -94.59, 40]],
  ['US-KY', 'USA-KY', 'Kentucky', [-85.3, 37.8], [-89.57, 36.5, -81.96, 39.15]],
  ['US-LA', 'USA-LA', 'Louisiana', [-91.9, 31], [-94.04, 28.9, -88.82, 33.02]],
  ['US-ME', 'USA-ME', 'Maine', [-69, 45.3], [-71.09, 43.06, -66.95, 47.46]],
  ['US-MD', 'USA-MD', 'Maryland', [-76.7, 39], [-79.49, 37.89, -75.05, 39.72]],
  ['US-MA', 'USA-MA', 'Massachusetts', [-71.8, 42.2], [-73.51, 41.24, -69.93, 42.89]],
  ['US-MI', 'USA-MI', 'Michigan', [-85.5, 44.3], [-90.42, 41.7, -82.12, 48.3]],
  ['US-MN', 'USA-MN', 'Minnesota', [-94.5, 46.3], [-97.24, 43.5, -89.49, 49.38]],
  ['US-MS', 'USA-MS', 'Mississippi', [-89.7, 32.7], [-91.66, 30.17, -88.1, 35.01]],
  ['US-MO', 'USA-MO', 'Missouri', [-92.6, 38.4], [-95.77, 35.99, -89.1, 40.61]],
  ['US-MT', 'USA-MT', 'Montana', [-110.8, 46.9], [-116.05, 44.36, -104.04, 49]],
  ['US-NE', 'USA-NE', 'Nebraska', [-99.8, 41.5], [-104.05, 40, -95.31, 43]],
  ['US-NV', 'USA-NV', 'Nevada', [-117, 39.3], [-120, 35, -114.04, 42]],
  ['US-NH', 'USA-NH', 'New Hampshire', [-71.6, 44], [-72.56, 42.69, -70.61, 45.31]],
  ['US-NJ', 'USA-NJ', 'New Jersey', [-74.6, 40.1], [-75.56, 38.93, -73.89, 41.36]],
  ['US-NM', 'USA-NM', 'New Mexico', [-106.1, 34.4], [-109.05, 31.33, -103, 37]],
  ['US-NY', 'USA-NY', 'New York', [-75.5, 42.9], [-79.76, 40.49, -71.86, 45.02]],
  ['US-NC', 'USA-NC', 'North Carolina', [-79.8, 35.5], [-84.32, 33.84, -75.46, 36.59]],
  ['US-ND', 'USA-ND', 'North Dakota', [-100.5, 47.5], [-104.05, 45.94, -96.55, 49]],
  ['US-OH', 'USA-OH', 'Ohio', [-82.8, 40.4], [-84.82, 38.4, -80.52, 41.98]],
  ['US-OK', 'USA-OK', 'Oklahoma', [-97.5, 35.6], [-103, 33.62, -94.43, 37]],
  ['US-OR', 'USA-OR', 'Oregon', [-120.5, 44.1], [-124.57, 42, -116.46, 46.3]],
  ['US-PA', 'USA-PA', 'Pennsylvania', [-77.8, 41], [-80.52, 39.72, -74.69, 42.27]],
  ['US-RI', 'USA-RI', 'Rhode Island', [-71.5, 41.7], [-71.89, 41.15, -71.12, 42.02]],
  ['US-SC', 'USA-SC', 'South Carolina', [-80.9, 33.9], [-83.35, 32.03, -78.54, 35.22]],
  ['US-SD', 'USA-SD', 'South Dakota', [-100.2, 44.4], [-104.06, 42.48, -96.43, 45.94]],
  ['US-TN', 'USA-TN', 'Tennessee', [-86.4, 35.9], [-90.31, 34.98, -81.65, 36.68]],
  ['US-TX', 'USA-TX', 'Texas', [-99.3, 31.4], [-106.65, 25.84, -93.51, 36.5]],
  ['US-UT', 'USA-UT', 'Utah', [-111.7, 39.3], [-114.05, 37, -109.04, 42]],
  ['US-VT', 'USA-VT', 'Vermont', [-72.7, 44.1], [-73.44, 42.73, -71.47, 45.02]],
  ['US-VA', 'USA-VA', 'Virginia', [-78.6, 37.8], [-83.68, 36.54, -75.24, 39.47]],
  ['US-WA', 'USA-WA', 'Washington', [-120.6, 47.4], [-124.77, 45.54, -116.92, 49]],
  ['US-WV', 'USA-WV', 'West Virginia', [-80.6, 38.6], [-82.65, 37.2, -77.72, 40.64]],
  ['US-WI', 'USA-WI', 'Wisconsin', [-89.8, 44.6], [-92.89, 42.49, -86.25, 47.08]],
  ['US-WY', 'USA-WY', 'Wyoming', [-107.6, 43], [-111.06, 41, -104.05, 45]],
]

function makeUsState([iso2, iso3, name, centroid, bbox]: UsStateSeed): UsStateGeometry {
  const [minLon, minLat, maxLon, maxLat] = bbox

  return {
    iso2,
    iso3,
    name,
    parentIso2: 'US',
    centroid,
    bbox,
    source: 'natural-earth-compatible-fixture',
    polygons: [{ rings: [{ kind: 'outer', points: [[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]] }] }],
  }
}

// Lightweight U.S. state presentation plates for premium state-level selection, highlighting, and camera focus.
export const usStates: UsStateGeometry[] = US_STATE_SEEDS.map(makeUsState)
