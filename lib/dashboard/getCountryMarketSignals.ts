import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type MarketSignal = {
  id: string
  title: string
  type: string
  commercial_impact: string | null
  confidence: number | null
  summary: string | null
  detected_at: string | null
}

// Fetches the 3 most recent qualified signals for a country.
// Cached for 1 hour — signals update frequently but not on every page load.
// Market field in ia_signals uses display names (e.g. "Germany"), not ISO2.
// We resolve via the countries table to get the display name from ISO2.
async function _getCountryMarketSignals(iso2: string): Promise<MarketSignal[]> {
  try {
    const supabase = await createClient()

    // Resolve country display name from ISO2
    const { data: countryRow } = await supabase
      .from('countries')
      .select('country_name')
      .eq('iso_alpha2', iso2.toUpperCase())
      .single()

    if (!countryRow?.country_name) return []

    const { data, error } = await supabase
      .from('ia_signals')
      .select('id, title, type, commercial_impact, confidence, summary, detected_at')
      .eq('stage', 'qualified')
      .eq('market', countryRow.country_name)
      .order('detected_at', { ascending: false })
      .limit(3)

    if (error || !data) return []
    return data.map(r => ({
      id:                r.id,
      title:             r.title,
      type:              r.type,
      commercial_impact: r.commercial_impact,
      confidence:        r.confidence,
      summary:           r.summary,
      detected_at:       r.detected_at,
    }))
  } catch {
    return []
  }
}

export const getCountryMarketSignals = unstable_cache(
  _getCountryMarketSignals,
  ['country-market-signals'],
  { revalidate: 3600, tags: ['market-signals'] },
)
