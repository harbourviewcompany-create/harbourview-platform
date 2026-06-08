/**
 * lib/dashboard/resolveMarket.ts
 *
 * Canonical single source of truth for market-code → SelectedMarket resolution.
 * Accepts ISO country codes (DE), US state codes (US-GA), Canadian province
 * codes (CA-ON), and any other subnational format supported by the globe registry.
 *
 * Returns null for unrecognized codes — never silently falls back to a stale
 * default such as Germany or Canada.
 *
 * Public-safe: exposes only display metadata (code, label, type, parentCountry).
 * No intelligence, pricing, admin, provenance, or counterparty fields are present.
 */

import { getCountryName } from '@/config/globe/country-role-profiles'
import { usStateByIso2 } from '@/data/globe/us-state-profiles'
import { canadaProvinceByIso2 } from '@/data/globe/canada-province-profiles'

export type MarketType = 'country' | 'state' | 'province' | 'region'

export interface SelectedMarket {
  /** Canonical market code, uppercased — e.g. 'US-GA', 'CA-ON', 'DE' */
  code: string
  /** Display label — e.g. 'Georgia', 'Ontario', 'Germany' */
  label: string
  /** Geographic granularity */
  type: MarketType
  /** ISO2 of the parent country for subnational codes ('US', 'CA') */
  parentCountry?: string
}

/**
 * Resolve any recognized market code to a SelectedMarket.
 * Returns null for unrecognized codes — callers must handle null explicitly.
 */
export function resolveMarket(raw: string): SelectedMarket | null {
  if (!raw?.trim()) return null
  const code = raw.trim().toUpperCase()

  // US state — e.g. US-GA, US-CA, US-NY
  const usState = usStateByIso2[code]
  if (usState) {
    return {
      code,
      label: usState.name,
      type: 'state',
      parentCountry: 'US',
    }
  }

  // Canadian province / territory — e.g. CA-ON, CA-BC, CA-AB
  const caProvince = canadaProvinceByIso2[code]
  if (caProvince) {
    return {
      code,
      label: caProvince.name,
      type: 'province',
      parentCountry: 'CA',
    }
  }

  // Country-level ISO2 — e.g. DE, AU, PT
  // getCountryName returns the raw code itself when the code is not in the registry;
  // treat that as a miss so we never display a raw code as a country name.
  const name = getCountryName(code)
  if (name && name !== code) {
    return { code, label: name, type: 'country' }
  }

  // Unrecognized — caller must handle null
  return null
}

/**
 * Parse a SelectedMarket from URL-style params.
 * Tries 'country' first; falls back to the first entry in a comma-separated
 * 'countries' list. Returns null if neither is present or recognized.
 */
export function resolveMarketFromParams(params: {
  country?: string | null
  countries?: string | null
}): SelectedMarket | null {
  const raw = params.country ?? params.countries?.split(',')[0]
  if (!raw?.trim()) return null
  return resolveMarket(raw.trim())
}

/**
 * Return the ISO2 country code appropriate for data-fetching.
 * For subnational markets, returns the parent country (US for US-GA, CA for CA-ON).
 * For country markets, returns the code directly.
 */
export function getEffectiveCountryIso2(market: SelectedMarket | null): string | null {
  if (!market) return null
  return market.parentCountry ?? market.code
}

/**
 * Return a human-readable market label for display copy.
 * Handles neutralisation of "country" vs "market" in UI headings.
 */
export function getMarketDisplayLabel(market: SelectedMarket | null): string | null {
  return market?.label ?? null
}
