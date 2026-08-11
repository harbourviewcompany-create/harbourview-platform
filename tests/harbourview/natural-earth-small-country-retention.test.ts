import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'

function runSourceRetentionProbe() {
  const script = String.raw`
    import { readFile } from 'node:fs/promises'
    import { transformFeature } from './scripts/generate-natural-earth-countries.mjs'

    const source = JSON.parse(await readFile('./data/globe/source/ne_50m_admin_0_countries.geojson', 'utf8'))
    const transformed = source.features.map((feature) => transformFeature(feature)).filter(Boolean)
    const vi = transformed.find((country) => country.iso2 === 'VI')
    const tiny = transformFeature({
      type: 'Feature',
      properties: { ISO_A2: 'ZZ', ADM0_A3: 'ZZZ', NAME_LONG: 'Synthetic Subthreshold' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [10, 10],
          [10.01, 10],
          [10.01, 10.01],
          [10, 10.01],
          [10, 10],
        ]],
      },
    })
    console.log(JSON.stringify({
      viPresent: Boolean(vi),
      viPolygonCount: vi?.polygons.length ?? 0,
      tinyDropped: tiny === null,
    }))
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (result.status !== 0) {
    throw new Error(`small-country source probe failed: status=${result.status} signal=${result.signal} error=${String(result.error)} stdout=${result.stdout} stderr=${result.stderr}`)
  }
  return JSON.parse(result.stdout.trim()) as {
    viPresent: boolean
    viPolygonCount: number
    tinyDropped: boolean
  }
}

describe('Natural Earth small-country retention', () => {
  it('retains source-eligible U.S. Virgin Islands without weakening the source-area floor', () => {
    const probe = runSourceRetentionProbe()
    expect(probe.viPresent).toBe(true)
    expect(probe.viPolygonCount).toBeGreaterThan(0)
    expect(probe.tinyDropped).toBe(true)
  }, 60_000)

  it('keeps VI in the checked-in generated payload', () => {
    const vi = naturalEarthCountriesPayload.countries.find((country) => country.iso2 === 'VI')
    expect(vi).toBeTruthy()
    expect(vi!.polygons.length).toBeGreaterThan(0)
  })
})
