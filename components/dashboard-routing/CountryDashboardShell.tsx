import Link from 'next/link'
import { dashboardSections, type DashboardSection, getDashboardCountryHref, getDashboardSectionHref, resolveCountryRouteParam } from '@/lib/dashboard/countryRegistry'

export function CountryDashboardShell({ countryParam, section, children }: { countryParam: string; section?: DashboardSection; children?: React.ReactNode }) {
  const country = resolveCountryRouteParam(countryParam)
  if (!country) return null
  return <div className='p-6 space-y-4'>
    <nav aria-label='Breadcrumbs' className='text-sm'><Link href='/dashboard'>Dashboard</Link> / {country.displayName}{section ? ` / ${section}` : ''}</nav>
    <header className='flex flex-wrap gap-3 items-center justify-between'>
      <h1 className='text-2xl font-semibold'>{country.displayName} Dashboard</h1>
      <Link href='/' aria-label='Back to globe'>Back to globe</Link>
    </header>
    <div className='flex gap-2 overflow-x-auto' aria-label='Dashboard sections'>
      <Link href={getDashboardCountryHref(country)}>Overview</Link>
      {dashboardSections.map((s) => <Link key={s} href={getDashboardSectionHref(country, s)}>{s}</Link>)}
    </div>
    <div>{children}</div>
  </div>
}
