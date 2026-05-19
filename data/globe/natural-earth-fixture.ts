import type { HarbourviewCountryGeometryPayload } from '@/lib/globe/geojson-country-types'

export const naturalEarthFixturePayload: HarbourviewCountryGeometryPayload = {
  provenance: {
    source: 'Natural Earth Admin 0 Countries',
    sourceScale: '1:110m',
    sourceVersion: 'fixture-scaffold-v1',
    sourceLicense: 'Public domain',
    boundaryModel: 'Natural Earth de facto boundaries',
    generatedAt: '2026-05-19T00:00:00.000Z',
    generatedBy: 'data/globe/natural-earth-fixture.ts',
    harbourviewTransformVersion: '0.2.0-fixture',
  },
  countries: [
    {
      iso2: 'DE',
      iso3: 'DEU',
      name: 'Germany',
      centroid: [10.4, 51.1],
      bbox: [5.8, 47.2, 15.1, 55.1],
      source: 'natural-earth-admin-0',
      polygons: [
        {
          rings: [
            {
              kind: 'outer',
              points: [[5.8, 47.4], [7.8, 47.2], [10.2, 47.6], [12.7, 48.0], [15.1, 50.0], [14.8, 52.6], [13.1, 54.8], [10.4, 55.1], [7.1, 54.0], [5.9, 51.2], [5.8, 47.4]],
            },
          ],
        },
      ],
    },
    {
      iso2: 'CA',
      iso3: 'CAN',
      name: 'Canada',
      centroid: [-98.3, 58.1],
      bbox: [-141, 42, -52, 83],
      source: 'natural-earth-admin-0',
      polygons: [
        {
          rings: [
            {
              kind: 'outer',
              points: [[-141, 49], [-132, 54], [-123, 50], [-110, 49], [-96, 50], [-82, 45], [-68, 47], [-52, 51], [-62, 64], [-79, 72], [-96, 83], [-117, 72], [-132, 68], [-141, 60], [-141, 49]],
            },
          ],
        },
      ],
    },
    {
      iso2: 'PT',
      iso3: 'PRT',
      name: 'Portugal',
      centroid: [-8.1, 39.6],
      bbox: [-9.6, 36.9, -6.1, 42.2],
      source: 'natural-earth-admin-0',
      polygons: [
        {
          rings: [
            {
              kind: 'outer',
              points: [[-9.6, 36.9], [-7.6, 37.1], [-6.1, 39.5], [-6.4, 41.9], [-8.8, 42.2], [-9.4, 40.0], [-9.6, 36.9]],
            },
          ],
        },
      ],
    },
    {
      iso2: 'NL',
      iso3: 'NLD',
      name: 'Netherlands',
      centroid: [5.3, 52.1],
      bbox: [3.2, 50.7, 7.2, 53.6],
      source: 'natural-earth-admin-0',
      polygons: [
        {
          rings: [
            {
              kind: 'outer',
              points: [[3.2, 51.0], [5.1, 50.7], [7.2, 51.7], [6.8, 53.4], [4.6, 53.6], [3.4, 52.5], [3.2, 51.0]],
            },
          ],
        },
      ],
    },
    {
      iso2: 'AU',
      iso3: 'AUS',
      name: 'Australia',
      centroid: [134.2, -25.3],
      bbox: [113.0, -44.0, 154.0, -10.0],
      source: 'natural-earth-admin-0',
      polygons: [
        {
          rings: [
            {
              kind: 'outer',
              points: [[113, -22], [122, -13], [137, -10], [153, -22], [154, -34], [144, -44], [128, -40], [116, -33], [113, -22]],
            },
          ],
        },
      ],
    },
  ],
}
