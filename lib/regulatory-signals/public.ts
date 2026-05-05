import 'server-only'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'
import { toPublicRegulatorySignal } from './safety'
import type { PublicRegulatorySignal, RegulatorySignalRecord, RegulatorySignalType } from './types'

const PUBLIC_SIGNALS_PATH = '/rest/v1/regulatory_signals.signals?select=*&review_status=eq.published&public_safe=eq.true&publish_to_public=eq.true&order=signal_date.desc'

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
  return project(await readPublishedRecords())
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
