import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCultivarPassports, getPublicServiceProviders, getPublicCollaborationProjects } from '@/lib/genetics/demoData'

export const metadata: Metadata = {
  title: 'Cultivar Passport Network | Harbourview',
  description: 'Controlled genetics passport, evidence, access, service-provider, and collaboration routing for regulated cannabis operators.',
}

export default function GeneticsLandingPage() {
  const cultivars = getPublicCultivarPassports()
  const services = getPublicServiceProviders()
  const collaborations = getPublicCollaborationProjects()

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-12 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-8 shadow-2xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview genetics</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Cultivar Passport Network</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#F5F1E8]/70">
            A permissioned trust, evidence, access, collaboration, and commercial-introduction layer for breeders, geneticists, rights holders, qualified operators, researchers, and service providers.
          </p>
          <p className="mt-4 max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/85">
            Harbourview does not operate an uncontrolled seed, clone, pollen, or plant-material marketplace. Physical genetics movement requires rights-holder review, jurisdiction review, and appropriate external clearances.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/genetics/cultivars" className="rounded-full bg-[#C6A55A] px-5 py-2.5 text-[#081423]">View public passports</Link>
            <Link href="/genetics/services" className="rounded-full border border-[#C6A55A]/40 px-5 py-2.5 text-[#C6A55A]">List service</Link>
            <Link href="/genetics/collaboration" className="rounded-full border border-white/20 px-5 py-2.5 text-[#F5F1E8]/80">Start collaboration</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Public passports" value={cultivars.length} href="/genetics/cultivars" />
          <SummaryCard label="Collaboration projects" value={collaborations.length} href="/genetics/collaboration" />
          <SummaryCard label="Service providers" value={services.length} href="/genetics/services" />
        </div>
      </section>
    </main>
  )
}

function SummaryCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5 transition hover:border-[#C6A55A]/40">
      <p className="text-xs uppercase tracking-[0.18em] text-[#F5F1E8]/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#C6A55A]">{value}</p>
      <p className="mt-2 text-sm text-[#F5F1E8]/60">Request access through reviewed Harbourview workflows.</p>
    </Link>
  )
}
