import HarbourviewDashboard from '@/components/dashboard/HarbourviewDashboard'
import { countries } from '@/lib/dashboard/countries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview user control center for Marketplace, Intelligence, Education, Signals, Requests, saved markets, and next actions.',
}

export default function DashboardHomePage() {
  return (
    <HarbourviewDashboard
      countries={countries.map((country) => ({
        iso2: country.iso2,
        slug: country.slug,
        displayName: country.displayName,
        region: country.region,
        dashboardStatus: country.dashboardStatus,
        publicSummary: country.publicSummary,
        dashboardPath: country.dashboardPath,
      }))}
    />
  )
}
