import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countryRegistry'

export default async function CountryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ country: string }> }) {
  const { country } = await params
  const resolved = resolveCountryRouteParam(country)
  const slug = resolved?.slug ?? country
  const tabs = ['market','education','compliance','signals','opportunities','intelligence','connections']
  return <div className="p-4 text-white"><div className="mb-3 flex gap-3"><Link href="/dashboard">Dashboard</Link><span>/</span><span>{resolved?.displayName ?? 'Unknown country'}</span></div><nav className="mb-4 flex gap-3 overflow-x-auto">{tabs.map(t=><Link key={t} href={`/dashboard/country/${slug}/${t}`}>{t}</Link>)}</nav>{children}</div>
}
