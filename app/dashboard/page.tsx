import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, getEduCategoriesForRole, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import { getMarketplaceRows, getPipelineCounts, getWantedListings, getLiveEduTiles, getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import CommandCentre from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import type { RoleId } from '@/types/globe-router'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview universal dashboard — Marketplace, Intel Signals, and Education in one view.',
}

export const dynamic = 'force-dynamic'

const ROLE_ALIASES: Record<string, RoleId> = {
  buyer: 'importer',
  importer: 'importer',
  importer_buyer: 'importer',
  supplier: 'exporter',
  exporter: 'exporter',
  seller: 'exporter',
  producer: 'cultivator_producer',
  cultivator: 'cultivator_producer',
  processor: 'processor_extractor',
  extractor: 'processor_extractor',
  doctor: 'doctor_prescriber',
  prescriber: 'doctor_prescriber',
  pharmacist: 'pharmacist',
  compliance: 'regulatory_compliance',
  regulator: 'government_regulator',
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeCountryParam(raw: string | null): string | null {
  if (!raw) return null
  const first = raw.split(',')[0]?.trim().toUpperCase()
  if (!first) return null
  const subMatch = first.match(/^([A-Z]{2})-[A-Z0-9]{2,3}$/)
  if (subMatch) return subMatch[1]
  return first.match(/^[A-Z]{2}$/)?.[0] ?? null
}

function normalizeRoleParam(raw: string | null): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const resolved = ROLE_ALIASES[key] ?? (key as RoleId)
  return ROLE_PROFILES[resolved] ? resolved : null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const urlCountry = normalizeCountryParam(firstParam(params.country) ?? firstParam(params.countries))
  const urlRole = normalizeRoleParam(firstParam(params.role))

  let storedCountryIso2: string | null = null
  let storedRoleId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prefs } = await supabase
        .from('user_dashboard_preferences')
        .select('country_iso2, role_id')
        .eq('user_id', user.id)
        .single()
      storedCountryIso2 = normalizeCountryParam(prefs?.country_iso2 ?? null)
      storedRoleId = normalizeRoleParam(prefs?.role_id ?? null)
    }
  } catch {
    // No auth or prefs table not yet migrated.
  }

  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId = urlRole ?? storedRoleId

  const [signals, wantedCount, marketplaceRows, pipeline, wantedListings, countryIntel, liveEduTiles] = await Promise.all([
    fetchDashboardSignals(8),
    getWantedRequestsCount(),
    getMarketplaceRows(countryIso2, 60),
    getPipelineCounts(),
    getWantedListings(),
    getCountryIntelProfile(countryIso2),
    getLiveEduTiles(roleId, 6),
  ])

  const staticEduCategories = getEduCategoriesForRole(roleId ?? undefined)
  const eduCategories = liveEduTiles.length > 0 ? liveEduTiles : staticEduCategories

  return (
    <CommandCentre
      key={`${countryIso2 ?? 'none'}-${roleId ?? 'none'}`}
      signals={signals}
      eduCategories={eduCategories}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
      wantedCount={wantedCount}
      marketplaceRows={marketplaceRows}
      pipeline={pipeline}
      wantedListings={wantedListings}
      countryIntel={countryIntel ?? undefined}
    />
  )
}
