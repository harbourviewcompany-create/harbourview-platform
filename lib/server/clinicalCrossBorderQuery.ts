import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type CrossBorderCheckDTO = {
  destinationCountryIso2: string
  matchKind: 'same-brand' | 'equivalent-profile' | 'no-match' | 'no-input'
  portabilityVerdict:
    | 'likely-portable'
    | 'profile-equivalent-available'
    | 'not-currently-available'
    | 'insufficient-input'
  matchedSourceType: 'sku' | 'product' | null
  matchedProductName: string | null
  matchedBrandName: string | null
  matchedAuthorizationStatus: string | null
  supplyRiskLevel: string | null
  supplySignalHeadline: string | null
  supplySignalSourceUrl: string | null
  generatedAt: string
}

export async function getCrossBorderFormularyCheck(opts: {
  destinationCountryIso2: string
  brandName?: string
  cannabinoidProfile?: string
}): Promise<{ state: 'loaded' | 'error'; result: CrossBorderCheckDTO | null; error?: string }> {
  const country = opts.destinationCountryIso2?.trim().toUpperCase()
  if (!country || country.length !== 2) {
    return { state: 'error', result: null, error: 'A 2-letter destination country_iso2 is required' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('clinical_cross_border_formulary_check', {
      p_destination_country_iso2: country,
      p_brand_name: opts.brandName?.trim() || null,
      p_cannabinoid_profile: opts.cannabinoidProfile?.trim() || null,
    })

    if (error) {
      return { state: 'error', result: null, error: error.message }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { state: 'error', result: null, error: 'No response from portability check' }
    }

    const r = row as Record<string, unknown>
    const result: CrossBorderCheckDTO = {
      destinationCountryIso2: String(r.destination_country_iso2 ?? country),
      matchKind: (r.match_kind as CrossBorderCheckDTO['matchKind']) ?? 'no-match',
      portabilityVerdict:
        (r.portability_verdict as CrossBorderCheckDTO['portabilityVerdict']) ?? 'not-currently-available',
      matchedSourceType: (r.matched_source_type as CrossBorderCheckDTO['matchedSourceType']) ?? null,
      matchedProductName: r.matched_product_name ? String(r.matched_product_name) : null,
      matchedBrandName: r.matched_brand_name ? String(r.matched_brand_name) : null,
      matchedAuthorizationStatus: r.matched_authorization_status ? String(r.matched_authorization_status) : null,
      supplyRiskLevel: r.supply_risk_level ? String(r.supply_risk_level) : null,
      supplySignalHeadline: r.supply_signal_headline ? String(r.supply_signal_headline) : null,
      supplySignalSourceUrl: r.supply_signal_source_url ? String(r.supply_signal_source_url) : null,
      generatedAt: String(r.generated_at ?? new Date().toISOString()),
    }

    return { state: 'loaded', result }
  } catch (e) {
    return {
      state: 'error',
      result: null,
      error: e instanceof Error ? e.message : 'Cross-border formulary check failed',
    }
  }
}
