export type PublicRegulatorySignal = {
  id: string
  slug: string
  headline: string
  signal_type: string
  confidence: string
  impact_level: string
  country_name?: string
  region?: string
  regulator_name?: string
  signal_date: string
  canonical_source_url?: string
  public_summary: string
  public_implication: string
  published_at?: string
  last_reviewed_at?: string
}
