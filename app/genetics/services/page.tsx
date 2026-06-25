import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicServiceProviders } from '@/lib/genetics/queries'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Genetics Service Providers | Harbourview' }

export default async function GeneticsServicesPage() {
  const providers = await getPublicServiceProviders()
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-12 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Service provider directory</p>
          <h1 className="mt-2 text-3xl font-semibold">Genetics service providers</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">Public-safe provider summaries for verification, genotyping, testing, tissue-culture, clean-stock, advisory, and nursery collaboration requests.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <article key={provider.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]">{provider.service_category.replace(/_/g, ' ')} · {provider.verification_level.replace(/_/g, ' ')}</p>
              <h2 className="mt-3 text-xl font-semibold">{provider.displayName}</h2>
              <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{provider.service_summary}</p>
              <p className="mt-3 text-xs text-[#F5F1E8]/45">{[provider.country_code, provider.jurisdiction_label].filter(Boolean).join(' — ')}</p>
              <Link href="/contact" className="mt-5 inline-flex rounded-full border border-[#C6A55A]/40 px-4 py-2 text-sm text-[#C6A55A]">Request verification</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
