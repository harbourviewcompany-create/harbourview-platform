import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicCultivarPassportBySlug } from '@/lib/genetics/demoData'

export const metadata: Metadata = { title: 'Cultivar Passport | Harbourview' }

export default async function CultivarPassportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const passport = getPublicCultivarPassportBySlug(slug)
  if (!passport) notFound()

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-12 text-[#F5F1E8] md:px-10">
      <article className="mx-auto max-w-6xl space-y-6">
        <Link href="/genetics/cultivars" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Public passports</Link>
        <header className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Public cultivar passport</p>
          <h1 className="mt-3 text-4xl font-semibold">{passport.displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#F5F1E8]/70">{passport.publicSummary}</p>
          <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/85">{passport.publicDisclaimer}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {passport.accessRequestCtas.map((cta) => (
              <Link key={cta} href="/contact" className="rounded-full border border-[#C6A55A]/40 px-4 py-2 text-[#C6A55A]">{cta}</Link>
            ))}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Breeder" value={passport.breederDisplayName ?? 'Request access'} />
          <InfoCard label="Rights holder" value={passport.rightsHolderDisplayName ?? 'Contact rights holder'} />
          <InfoCard label="Origin" value={[passport.originCountryCode, passport.originJurisdictionLabel].filter(Boolean).join(' — ') || 'Not assessed'} />
          <InfoCard label="Verification" value={passport.verificationSummary ?? 'Not assessed'} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
          <h2 className="text-lg font-semibold">Country-specific opportunities</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {passport.countryOpportunitiesPublic.map((opportunity) => (
              <div key={`${opportunity.countryCode}-${opportunity.opportunityType}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-[#C6A55A]">{opportunity.countryCode} · {opportunity.opportunityType.replace(/_/g, ' ')}</p>
                <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/60">{opportunity.publicNote}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#F5F1E8]/40">{opportunity.materialTransferStatus.replace(/_/g, ' ')} · {opportunity.jurisdictionGateStatus.replace(/_/g, ' ')}</p>
                <Link href="/contact" className="mt-3 inline-flex rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-xs text-[#C6A55A]">{opportunity.cta}</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
            <h2 className="text-lg font-semibold">Public evidence summaries</h2>
            {passport.publicEvidenceSummaries.map((item) => (
              <div key={item.id} className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#F5F1E8]/65">
                <p className="font-semibold text-[#F5F1E8]">{item.title}</p>
                <p className="mt-1">{item.publicSummary}</p>
                <p className="mt-2 text-xs text-[#F5F1E8]/40">{item.claimStatus.replace(/_/g, ' ')} · {item.sourceLabel ?? 'Source pending'}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
            <h2 className="text-lg font-semibold">Collaboration projects</h2>
            {passport.publicCollaborationProjects.length === 0 ? <p className="mt-4 text-sm text-[#F5F1E8]/55">No public collaboration projects linked.</p> : passport.publicCollaborationProjects.map((project) => (
              <div key={project.id} className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#F5F1E8]/65">
                <p className="font-semibold text-[#F5F1E8]">{project.title}</p>
                <p className="mt-1">{project.publicSummary}</p>
                <Link href="/contact" className="mt-3 inline-flex rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-xs text-[#C6A55A]">{project.cta}</Link>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5"><p className="text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/45">{label}</p><p className="mt-2 text-sm text-[#F5F1E8]/80">{value}</p></div>
}
