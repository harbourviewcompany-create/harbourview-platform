import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { PublicSection, SectionHeader } from '@/components/PublicUi'
import { hubPages } from '@/lib/institutional/content'
import { EDUCATION_ROLE_LABELS } from '@/lib/education/country-role'

export const metadata: Metadata = {
  title: 'Global Education Intelligence | Harbourview',
  description: 'Country-aware, role-aware and source-controlled education architecture for regulated-market stakeholders.',
}

const publicModules = [
  ['Start with Harbourview Education', 'Choose country and role context before moving into deeper education modules.'],
  ['Product Forms and Routes', 'Public-safe overview rails for product form literacy.'],
  ['Quality Standards Primer', 'GMP, GACP, GDP, COA and audit-readiness education structure for regulated supply chains.'],
  ['Supplier Readiness', 'Documentation, listing-readiness and review-gated marketplace education for suppliers.'],
  ['Buyer and Importer Education', 'Procurement, supplier-screening and import-readiness education held behind source review where needed.'],
  ['Source Methodology', 'How Harbourview separates public summaries from private evidence and source-control work.'],
] as const

const lockedModules = ['Professional tools', 'Reference tables', 'Country-specific access pathways', 'Import/export and licensing guides', 'Specialized workflows', 'Condition evidence maps'] as const

export default function EducationPage() {
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
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {publicModules.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#C6A55A]">Public-safe module</p>
              <h2 className="mt-3 text-lg font-semibold text-[#F5F1E8]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{body}</p>
            </article>
          ))}
        </div>
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
