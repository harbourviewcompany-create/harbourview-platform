import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, getEduCategoriesForRole, getCountryStatusBar } from '@/lib/dashboard/dashboardServerData'
import UniversalDashboard from '@/components/dashboard/UniversalDashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview universal dashboard — Marketplace, Intel Signals, and Education in one view.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // ── Fetch signals (live from Supabase, falls back to fixtures) ──
  const signals = await fetchDashboardSignals(8)

  // ── Load user preferences if authenticated ──
  let countryIso2: string | null = null
  let roleId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: prefs } = await supabase
        .from('user_dashboard_preferences')
        .select('country_iso2, role_id')
        .eq('user_id', user.id)
        .single()

      countryIso2 = prefs?.country_iso2 ?? null
      roleId = prefs?.role_id ?? null
    }
  } catch {
    // No auth or prefs table not yet migrated — fine, show picker
  }

  // ── Derive status bar and edu categories from stored prefs ──
  const countryBar = getCountryStatusBar(countryIso2 ?? 'DE')
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
