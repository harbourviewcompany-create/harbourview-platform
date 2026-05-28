import Link from 'next/link'
import { DashboardSection, dashboardSections, getDashboardSectionHref, resolveCountryRouteParam } from '@/lib/dashboard/country-registry'

export function DashboardShell({ countryParam, section, children }: { countryParam: string; section?: DashboardSection; children?: React.ReactNode }) {
  const country = resolveCountryRouteParam(countryParam)
  if (!country) return null
  return (
    <div className="min-h-screen bg-[#03070D] text-white p-4">
      <div className="text-xs opacity-70">Dashboard / {country.displayName} / {section ?? 'overview'}</div>
      <h1 className="text-2xl font-semibold mt-2">{country.displayName} Dashboard</h1>
      <p className="mt-1 text-sm opacity-80">{country.publicSummary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {dashboardSections.map((s) => <Link key={s} href={getDashboardSectionHref(country.slug, s)} className="px-3 py-1 border rounded">{s}</Link>)}
      </div>
      <div className="mt-3 text-sm">Status: {country.dashboardStatus} · Availability: {country.routeAvailability}</div>
      <div className="mt-4 border-t border-white/20 pt-4">{children}</div>
      <Link href="/" className="inline-block mt-4 underline">Back to Globe</Link>
    </div>
  )
}
