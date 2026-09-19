import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'

export function buildConfidenceBars(intel?: CountryIntelProfile | null): { label: string; pct: number }[] {
  const dc = (intel?.data_completeness ?? '').toLowerCase()
  const opp = intel?.opportunity_score ?? null
  const base = dc === 'full' ? 88 : dc === 'high' ? 85 : dc === 'partial' ? 65 : 38
  const mkt = opp != null ? Math.min(94, Math.max(20, Math.round(opp * 0.94))) : Math.max(20, base - 5)
  return [
    { label: 'Regulatory', pct: Math.min(94, base) },
    { label: 'Market Data', pct: mkt },
    { label: 'Access Pathway', pct: Math.max(20, base - 8) },
    { label: 'Local Intel', pct: Math.max(20, base - 12) },
    { label: 'Education Content', pct: Math.min(94, base + 4) },
  ]
}
