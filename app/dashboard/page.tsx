import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, getEduCategoriesForRole, getCountryStatusBar } from '@/lib/dashboard/dashboardServerData'
import UniversalDashboard from '@/components/dashboard/UniversalDashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview universal dashboard — Marketplace, Intel Signals, and Education in one view.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  // ── URL params win (sourced from globe router) ──
  const urlCountry = typeof searchParams.country === 'string'
    ? searchParams.country.toUpperCase()
    : null
  const urlRole = typeof searchParams.role === 'string'
    ? searchParams.role
    : null

  // ── Fetch signals (live from Supabase, falls back to fixtures) ──
  const signals = await fetchDashboardSignals(8)

  // ── Load user preferences if authenticated ──
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

      storedCountryIso2 = prefs?.country_iso2 ?? null
      storedRoleId = prefs?.role_id ?? null
    }
  } catch {
    // No auth or prefs table not yet migrated — fine, show picker
  }

  // Globe router URL params override stored prefs
  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId = urlRole ?? storedRoleId

  // ── Derive status bar and edu categories from resolved context ──
  const countryBar = getCountryStatusBar(countryIso2)
  const eduCategories = getEduCategoriesForRole(roleId ?? undefined)

  return (
    <UniversalDashboard
      signals={signals}
      eduCategories={eduCategories}
      countryBar={countryBar}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
    />
  )
}
