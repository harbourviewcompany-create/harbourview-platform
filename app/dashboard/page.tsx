import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, getEduCategoriesForRole, getCountryStatusBar } from '@/lib/dashboard/dashboardServerData'
import TargetDashboard from '@/components/dashboard/TargetDashboard'
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

  // Globe routes sometimes pass regional IDs such as CA-QC; the dashboard state is ISO2.
  const iso2 = first.match(/^[A-Z]{2}/)?.[0] ?? null
  return iso2 && iso2.length === 2 ? iso2 : null
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

  // Globe router URL params override stored preferences. Support both country and countries.
  const urlCountry = normalizeCountryParam(firstParam(params.country) ?? firstParam(params.countries))
  const urlRole = normalizeRoleParam(firstParam(params.role))

  const signals = await fetchDashboardSignals(8)

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
    // No auth or prefs table not yet migrated — show URL context or picker defaults.
  }

  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId = urlRole ?? storedRoleId

  const countryBar = getCountryStatusBar(countryIso2)
  const eduCategories = getEduCategoriesForRole(roleId ?? undefined)

  return (
    <TargetDashboard
      signals={signals}
      eduCategories={eduCategories}
      countryBar={countryBar}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
    />
  )
}
