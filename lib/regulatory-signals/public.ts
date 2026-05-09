import 'server-only'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'
import { toPublicRegulatorySignal } from './safety'
import type { PublicRegulatorySignal, RegulatorySignalRecord, RegulatorySignalType } from './types'

const PUBLIC_SIGNALS_PATH = '/rest/v1/regulatory_signals.signals?select=*&review_status=eq.published&public_safe=eq.true&publish_to_public=eq.true&order=signal_date.desc'

const FALLBACK_PUBLIC_SIGNALS: PublicRegulatorySignal[] = [
  {
    id: 'fallback-de-001',
    slug: 'germany-import-pathway-review',
    headline: 'Germany import pathway review activity continues under controlled GMP expectations.',
    signal_type: 'import_export_pathway',
    confidence: 'medium',
    impact_level: 'moderate',
    country_code: 'DE',
    country_name: 'Germany',
    region: 'Europe',
    jurisdiction: 'Federal',
    regulator_name: 'BfArM',
    signal_date: '2026-05-01',
    source_tier: 'tier_1_official',
    source_type: 'health_authority',
    canonical_source_url: 'https://www.bfarm.de',
    public_summary: 'Public-safe review of import pathway conditions and quality expectations relevant to regulated medical supply access.',
    public_implication: 'Commercial participants should maintain validated quality and route-review discipline before engagement.',
    published_at: '2026-05-01',
    last_reviewed_at: '2026-05-02',
  },
  {
    id: 'fallback-au-001',
    slug: 'australia-patient-access-review',
    headline: 'Australia patient-access pathway review highlights continued prescription oversight.',
    signal_type: 'prescription_patient_access',
    confidence: 'medium',
    impact_level: 'moderate',
    country_code: 'AU',
    country_name: 'Australia',
    region: 'Oceania',
    jurisdiction: 'Federal',
    regulator_name: 'TGA',
    signal_date: '2026-04-28',
    source_tier: 'tier_1_official',
    source_type: 'health_authority',
    canonical_source_url: 'https://www.tga.gov.au',
    public_summary: 'Reviewed public summary focused on prescription access frameworks and compliance-sensitive market participation.',
    public_implication: 'Operators should confirm jurisdiction-specific access controls and prescribing requirements.',
    published_at: '2026-04-29',
    last_reviewed_at: '2026-04-30',
  },
  {
    id: 'fallback-pl-001',
    slug: 'poland-market-access-monitoring',
    headline: 'Poland market-access monitoring remains under publication-controlled review.',
    signal_type: 'licensing_market_access',
    confidence: 'low',
    impact_level: 'moderate',
    country_code: 'PL',
    country_name: 'Poland',
    region: 'Europe',
    jurisdiction: 'National',
    regulator_name: 'Health Ministry',
    signal_date: '2026-04-20',
    source_tier: 'tier_2_professional',
    source_type: 'professional_body',
    canonical_source_url: 'https://www.gov.pl',
    public_summary: 'Controlled publication summary regarding reviewed licensing and commercial pathway considerations.',
    public_implication: 'Participants should avoid assuming route certainty or guaranteed access based on preliminary market visibility.',
    published_at: '2026-04-22',
    last_reviewed_at: '2026-04-23',
  },
]

async function readPublishedRecords(): Promise<RegulatorySignalRecord[]> {
  const result = await fetchAdminSupabaseJson<RegulatorySignalRecord[]>(PUBLIC_SIGNALS_PATH)
  if (!result.ok) return []
  return result.data
}

function project(records: RegulatorySignalRecord[]): PublicRegulatorySignal[] {
  return records
    .map(toPublicRegulatorySignal)
    .filter((signal): signal is PublicRegulatorySignal => Boolean(signal))
}

export async function getPublicRegulatorySignals(): Promise<PublicRegulatorySignal[]> {
  const published = project(await readPublishedRecords())
  return published.length ? published : FALLBACK_PUBLIC_SIGNALS
}

export async function getPublicRegulatorySignalBySlug(slug: string): Promise<PublicRegulatorySignal | null> {
  const signals = await getPublicRegulatorySignals()
  return signals.find((signal) => signal.slug === slug) || null
}

export async function getPublicRegulatorySignalsByCountry(country: string): Promise<PublicRegulatorySignal[]> {
  const normalized = country.toLowerCase()
  const signals = await getPublicRegulatorySignals()
  return signals.filter((signal) =>
    [signal.country_code, signal.country_name]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().replace(/\s+/g, '-') === normalized),
  )
}

export async function getPublicRegulatorySignalsByType(type: string): Promise<PublicRegulatorySignal[]> {
  const signals = await getPublicRegulatorySignals()
  return signals.filter((signal) => signal.signal_type === type as RegulatorySignalType)
}

export async function getPublicRegulatorySignalCountries() {
  const signals = await getPublicRegulatorySignals()
  const countries = new Map<string, { countryCode: string | null; countryName: string; region: string | null; count: number; latestSignalDate: string }>()

  for (const signal of signals) {
    if (!signal.country_name) continue
    const key = signal.country_name.toLowerCase()
    const existing = countries.get(key)
    if (!existing) {
      countries.set(key, {
        countryCode: signal.country_code,
        countryName: signal.country_name,
        region: signal.region,
        count: 1,
        latestSignalDate: signal.signal_date,
      })
    } else {
      existing.count += 1
      if (signal.signal_date > existing.latestSignalDate) existing.latestSignalDate = signal.signal_date
    }
  }

  return Array.from(countries.values()).sort((a, b) => a.countryName.localeCompare(b.countryName))
}

export async function getPublicRegulatorySignalTypes() {
  const signals = await getPublicRegulatorySignals()
  const types = new Map<string, { type: RegulatorySignalType; count: number; latestSignalDate: string }>()

  for (const signal of signals) {
    const existing = types.get(signal.signal_type)
    if (!existing) {
      types.set(signal.signal_type, { type: signal.signal_type, count: 1, latestSignalDate: signal.signal_date })
    } else {
      existing.count += 1
      if (signal.signal_date > existing.latestSignalDate) existing.latestSignalDate = signal.signal_date
    }
  }

  return Array.from(types.values()).sort((a, b) => a.type.localeCompare(b.type))
}
