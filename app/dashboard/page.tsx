import Link from 'next/link'
import { countryRegistry, getDashboardCountryHref } from '@/lib/dashboard/countryRegistry'

export default function DashboardHomePage() {
  return <main className='p-6 space-y-4'>
    <h1 className='text-3xl font-semibold'>Harbourview Dashboard</h1>
    <p>Country directory fallback for non-WebGL routing.</p>
    <div className='grid gap-3 md:grid-cols-2'>
      {countryRegistry.map((c) => <article key={c.slug} className='border p-3 rounded'>
        <h2 className='font-medium'>{c.displayName}</h2><p className='text-sm'>{c.region} · {c.dashboardStatus}</p>
        <Link href={getDashboardCountryHref(c)}>Open dashboard</Link>
      </article>)}
    </div>
  </main>
}
