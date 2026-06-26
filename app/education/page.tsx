import type { Metadata } from 'next'
import Link from 'next/link'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { PublicSection, SectionHeader } from '@/components/PublicUi'
import { hubPages } from '@/lib/institutional/content'
import { EDUCATION_ROLE_LABELS } from '@/lib/education/country-role'
import { getEducationTracks } from '@/lib/server/educationModulesQuery'

export const dynamic = 'force-dynamic'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Global Education Intelligence | Harbourview',
  description: 'Country-aware, role-aware and source-controlled education architecture for regulated-market stakeholders.',
}

const lockedModules = ['Professional tools', 'Reference tables', 'Country-specific access pathways', 'Import/export and licensing guides', 'Specialized workflows', 'Condition evidence maps'] as const

export default async function EducationPage() {
  const tracks = await getEducationTracks()
  const moduleCount = tracks.reduce((sum, t) => sum + t.modules.length, 0)

  return (
    <>
      <InstitutionalPage page={hubPages.education} sectionId="education-intelligence" />
      <PublicSection tone="dark">
        <SectionHeader eyebrow="Education intelligence foundation" title="Country-aware education, role-aware modules and source-controlled public summaries.">
          Harbourview Education is being structured as a claim-controlled education layer. Public pages use safe summaries only; professional, jurisdiction-specific and restricted material stays locked until reviewed source rows support publication.
        </SectionHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A55A]">Country selector</p>
            <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/70">Global by default. Country and subjurisdiction education unlock only after source-backed review.</p>
          </div>
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6A55A]">Role selector</p>
            <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/70">Roles include {Object.values(EDUCATION_ROLE_LABELS).slice(0, 7).join(', ')} and additional commercial, policy and admin contexts.</p>
          </div>
        </div>

        {moduleCount > 0 ? (
          <div className="mt-10">
            {tracks.map((track) => (
              <div key={track.trackId} className="mb-9">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">{track.label}</p>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {track.modules.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/education/modules/${m.slug}`}
                      className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-gold/40 hover:bg-white/[0.05]"
                    >
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#C6A55A]">Public-safe module</p>
                      <h2 className="mt-3 text-lg font-semibold text-[#F5F1E8]">{m.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{m.description}</p>
                      <p className="mt-4 text-xs font-semibold text-gold/80">Read module →</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-6 text-white/60">
            Education modules are being prepared for publication. Check back shortly.
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-amber-300/25 bg-amber-950/10 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Locked until source review</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lockedModules.map((item) => <div key={item} className="rounded-xl border border-amber-200/15 bg-black/15 px-4 py-3 text-sm text-[#F5F1E8]/70">{item}</div>)}
          </div>
        </div>
      </PublicSection>
    </>
  )
}
