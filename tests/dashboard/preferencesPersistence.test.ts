import { describe, expect, it } from 'vitest'
import { buildPreferencesPatchBody } from '@/lib/dashboard/preferencesPersistence'

// Regression coverage for PR #1013: a role/country change made before the
// initial GET of /api/dashboard/preferences resolves must not PATCH
// heatmap_layer: 'none' over a user's real saved value.

describe('buildPreferencesPatchBody', () => {
  it('returns null before the initial preferences GET has resolved (the race)', () => {
    const body = buildPreferencesPatchBody(
      { userEmail: 'buyer@example.com', preferencesLoaded: false, heatmapLayer: 'none' },
      { country_iso2: 'MX' },
      { country_iso2: 'US', role_id: 'buyer' },
    )
    expect(body).toBeNull()
  })

  it('returns null when the initial GET failed (preferencesLoaded stays false)', () => {
    // Simulates the .catch() branch: heatmapLayer is still stuck at 'none',
    // and preferencesLoaded was never flipped true.
    const body = buildPreferencesPatchBody(
      { userEmail: 'buyer@example.com', preferencesLoaded: false, heatmapLayer: 'none' },
      { role_id: 'seller' },
      { country_iso2: 'US', role_id: 'buyer' },
    )
    expect(body).toBeNull()
  })

  it('returns null for a signed-out user regardless of load state', () => {
    const body = buildPreferencesPatchBody(
      { userEmail: null, preferencesLoaded: true, heatmapLayer: 'clinical_education_demand' },
      { country_iso2: 'MX' },
      { country_iso2: 'US', role_id: 'buyer' },
    )
    expect(body).toBeNull()
  })

  it('sends the real saved heatmap_layer once the initial GET has resolved', () => {
    const body = buildPreferencesPatchBody(
      { userEmail: 'buyer@example.com', preferencesLoaded: true, heatmapLayer: 'clinical_education_demand' },
      { country_iso2: 'MX' },
      { country_iso2: 'US', role_id: 'buyer' },
    )
    expect(body).toEqual({
      country_iso2: 'MX',
      role_id: 'buyer',
      heatmap_layer: 'clinical_education_demand',
    })
  })

  it('falls back to current country/role when next only specifies one field', () => {
    const body = buildPreferencesPatchBody(
      { userEmail: 'buyer@example.com', preferencesLoaded: true, heatmapLayer: 'marketplace_activity' },
      { role_id: 'seller' },
      { country_iso2: 'DE', role_id: 'buyer' },
    )
    expect(body).toEqual({
      country_iso2: 'DE',
      role_id: 'seller',
      heatmap_layer: 'marketplace_activity',
    })
  })
})
