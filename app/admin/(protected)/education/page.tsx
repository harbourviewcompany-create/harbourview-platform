import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { EDUCATION_SOURCE_HIERARCHY } from '@/lib/education/source-hierarchy'
import { NON_PUBLISHABLE_REVIEW_STATUSES, PUBLISHABLE_REVIEW_STATUSES } from '@/lib/education/review-status'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const panels = [
  ['Claim queue', 'Review-gated claim records and release decisions.'],
  ['Source registry', 'Authority records and freshness windows.'],
  ['DTO allowlist', 'Public output must be produced through server-side allowlisting.'],
  ['Freshness checks', 'Changed sources route back to review.'],
  ['Country-role preview', 'Preview country, subjurisdiction and role outputs.'],
  ['Claim sweep', 'Blocked states stay out of public pages.'],
  ['Reference safety gate', 'Reference tables stay gated until reviewed.'],
  ['Public route checklist', 'Verify public routes show safe summaries only.'],
] as const

export default async function AdminEducationPage() {
  await requireAdminAuth()

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Education intelligence</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Global Education Review Control</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">
          Admin-only shell for claim review, source control, country-role preview and release gates. This first pass adds the control surface without publishing restricted material.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {panels.map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-5">
            <h3 className="text-sm font-semibold text-[#F5F1E8]">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/55">{body}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#C6A55A]/20 bg-black/15 p-5">
          <h3 className="text-sm font-semibold text-[#C6A55A]">Release statuses</h3>
          <ul className="mt-3 space-y-2 text-xs text-[#F5F1E8]/65">
            {Array.from(PUBLISHABLE_REVIEW_STATUSES).map((status) => <li key={status}>{status}</li>)}
          </ul>
        </article>
        <article className="rounded-2xl border border-[#C6A55A]/20 bg-black/15 p-5">
          <h3 className="text-sm font-semibold text-[#C6A55A]">Blocked statuses</h3>
          <ul className="mt-3 space-y-2 text-xs text-[#F5F1E8]/65">
            {Array.from(NON_PUBLISHABLE_REVIEW_STATUSES).map((status) => <li key={status}>{status}</li>)}
          </ul>
        </article>
        <article className="rounded-2xl border border-[#C6A55A]/20 bg-black/15 p-5">
          <h3 className="text-sm font-semibold text-[#C6A55A]">Source hierarchy</h3>
          <ul className="mt-3 space-y-2 text-xs text-[#F5F1E8]/65">
            {EDUCATION_SOURCE_HIERARCHY.map((source) => <li key={source.key}>Tier {source.tier}: {source.key}</li>)}
          </ul>
        </article>
      </div>
    </section>
  )
}
