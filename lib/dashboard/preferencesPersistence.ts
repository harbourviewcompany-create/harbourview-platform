// Shared gating logic for persisting role/country/heatmap-layer selection to
// /api/dashboard/preferences from CommandCentre.tsx and MobileCommandCentre.tsx.
//
// Extracted so both components share one implementation instead of two copies
// drifting apart — the original bug (a premature PATCH clobbering a user's
// saved heatmap_layer with the 'none' placeholder before the initial GET
// resolved) existed independently in both files.

export interface PreferencesLoadState {
  userEmail: string | null | undefined
  preferencesLoaded: boolean
  heatmapLayer: string
}

export interface PreferencesPatchBody {
  country_iso2: string
  role_id: string
  heatmap_layer: string
}

/**
 * Returns the PATCH body to send to /api/dashboard/preferences, or null if the
 * request should be skipped entirely. Skips until the initial GET of the
 * user's saved preferences has resolved, so a role/country change made while
 * that GET is still in flight (or after it failed) never overwrites a real
 * saved heatmap_layer with the ref's 'none' initial value.
 */
export function buildPreferencesPatchBody(
  state: PreferencesLoadState,
  next: { country_iso2?: string; role_id?: string },
  current: { country_iso2: string; role_id: string },
): PreferencesPatchBody | null {
  if (!state.userEmail || !state.preferencesLoaded) return null
  return {
    country_iso2: next.country_iso2 ?? current.country_iso2,
    role_id: next.role_id ?? current.role_id,
    heatmap_layer: state.heatmapLayer,
  }
}
