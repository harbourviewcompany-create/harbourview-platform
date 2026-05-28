import Link from 'next/link'
import { countries, dashboardSections, getDashboardCountryHref, getDashboardSectionHref, resolveCountryRouteParam } from '@/lib/dashboard/countries'

export function CountryShell({ countryParam, section }: { countryParam: string; section?: string }) {
  const country = resolveCountryRouteParam(countryParam)
  if (!country) return null
  return <div className="p-6 text-sm text-white">
    <div className="mb-4">Dashboard / {country.displayName} {section ? `/ ${section}` : ''}</div>
    <div className="mb-4">Status: {country.dashboardStatus} · Last updated: {country.lastUpdated}</div>
    <div className="mb-4 flex gap-2 flex-wrap">{dashboardSections.map(s => <Link key={s} href={getDashboardSectionHref(country.slug,s)} className="underline">{s}</Link>)}</div>
    <div className="mb-4">Switch country: {countries.map(c => <Link key={c.slug} href={getDashboardCountryHref(c.slug)} className="mr-3 underline">{c.displayName}</Link>)}</div>
    <Link href="/" className="underline">Back to globe</Link>
  </div>
}
