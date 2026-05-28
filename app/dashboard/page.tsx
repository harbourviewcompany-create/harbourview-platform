import Link from 'next/link'
import { countries, getDashboardCountryHref } from '@/lib/dashboard/countries'

export default function DashboardHomePage() {
  return <main className="p-6 text-white"><h1 className="text-2xl mb-4">Dashboard</h1>{countries.map(c => <div key={c.slug}><Link className="underline" href={getDashboardCountryHref(c.slug)}>{c.displayName}</Link></div>)}</main>
}
