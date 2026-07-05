import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicSection, SectionHeader, PublicCtaGroup } from '@/components/PublicUi'
import { getEducationModuleBySlug, getPublishedEducationModules, getTrackLabelMap, getModuleSections, AUDIENCE_LABELS } from '@/lib/server/educationModulesQuery'

export const revalidate = 3600

export async function generateStaticParams() {
  const modules = await getPublishedEducationModules()
  return modules.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const module_ = await getEducationModuleBySlug(slug)
  if (!module_) return { title: 'Education Module | Harbourview' }
  return {
    title: `${module_.title} | Harbourview Education`,
    description: module_.description,
  }
}

export default async function EducationModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [module_, trackLabelMap] = await Promise.all([
    getEducationModuleBySlug(slug),
    getTrackLabelMap(),
  ])
  if (!module_) return notFound()

  const sections = await getModuleSections(module_.id)
  const trackLabel = trackLabelMap[module_.track_id] ?? module_.track_id
  const audienceLabels = module_.audience.map((a) => AUDIENCE_LABELS[a] ?? a)

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <PublicSection tone="dark" className="pt-14 sm:pt-16">
        <Link href="/education" className="text-xs font-semibold uppercase tracking-[0.24em] text-gold/70 hover:text-gold">
          ← Education Hub
        </Link>
        <SectionHeader eyebrow={trackLabel} title={module_.title} className="mt-6">
          {module_.description}
        </SectionHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A55A]">Track</p>
            <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/80">{trackLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A55A]">Relevant audience</p>
            <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/80">{audienceLabels.join(', ')}</p>
          </div>
        </div>

        {sections.length > 0 ? (
          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-[#F5F1E8]">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-base leading-8 text-white/75">{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#C6A55A]">Public-safe module</p>
            <p className="mt-4 text-base leading-8 text-white/75">{module_.description}</p>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Education boundary</p>
          <p className="text-sm leading-7 text-white/50">
            Harbourview education modules are informational and non-promotional. They do not provide medical advice, prescribing instructions, legal advice, regulatory guidance, investment advice or compliance certification.
          </p>
        </div>

        <PublicCtaGroup
          className="mt-8"
          actions={[
            { label: 'Browse all education modules', href: '/education', variant: 'secondary' },
            { label: 'Request deeper access', href: '/education/request' },
          ]}
        />
      </PublicSection>
    </main>
  )
}
