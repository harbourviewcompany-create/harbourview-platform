import Link from 'next/link'
import { dashboardCountries } from '@/lib/dashboard/country-registry'

export default function NotFound() {
  return <div className="p-5 text-white bg-[#03070D] min-h-screen"><h1 className="text-xl">Country not found</h1><p>Search, browse by region, or return to globe.</p><div className="mt-3">{dashboardCountries.slice(0,5).map(c => <Link key={c.slug} className="block underline" href={c.dashboardPath}>{c.displayName}</Link>)}</div><Link href="/" className="underline mt-4 inline-block">Return to globe</Link></div>
}
