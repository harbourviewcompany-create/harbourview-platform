import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type ClinicalSupplyOutlookDTO = {
  countryIso2: string
  riskLevel: 'elevated' | 'watch' | 'normal' | 'insufficient-data'
  signalCount90d: number
  signalCountLookback: number
  topCategory: string | null
  mostRecentHeadline: string | null
  mostRecentSummary: string | null
  mostRecentSourceUrl: string | null
  mostRecentSignalAt: string | null
  generatedAt: string
}

export async function getClinicalSupplyOutlook(opts: {
  countryIso2: string
  lookbackDays?: number
}): Promise<{ state: 'loaded' | 'empty' | 'error'; outlook: ClinicalSupplyOutlookDTO | null; error?: string }> {
  const country = opts.countryIso2?.trim().toUpperCase()
  if (!country || country.length !== 2) {
    return { state: 'error', outlook: null, error: 'A 2-letter country_iso2 is required' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('clinical_jurisdiction_supply_outlook', {
      p_country_iso2: country,
      p_lookback_days: opts.lookbackDays ?? 180,
    })

    if (error) {
      return { state: 'error', outlook: null, error: error.message }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { state: 'empty', outlook: null }
    }

    const r = row as Record<string, unknown>
    const outlook: ClinicalSupplyOutlookDTO = {
      countryIso2: String(r.country_iso2 ?? country),
      riskLevel: (r.risk_level as ClinicalSupplyOutlookDTO['riskLevel']) ?? 'insufficient-data',
      signalCount90d: Number(r.signal_count_90d ?? 0),
      signalCountLookback: Number(r.signal_count_lookback ?? 0),
      topCategory: r.top_category ? String(r.top_category) : null,
      mostRecentHeadline: r.most_recent_headline ? String(r.most_recent_headline) : null,
      mostRecentSummary: r.most_recent_summary ? String(r.most_recent_summary) : null,
      mostRecentSourceUrl: r.most_recent_source_url ? String(r.most_recent_source_url) : null,
      mostRecentSignalAt: r.most_recent_signal_at ? String(r.most_recent_signal_at) : null,
      generatedAt: String(r.generated_at ?? new Date().toISOString()),
    }

    return { state: 'loaded', outlook }
  } catch (e) {
    return {
      state: 'error',
      outlook: null,
      error: e instanceof Error ? e.message : 'Supply outlook query failed',
    }
  }
}
