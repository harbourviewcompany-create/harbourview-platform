import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listInstitutionalReports } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

export default async function ReportsOverviewPage() {
  await requireAdminAuth()
  const result = await listInstitutionalReports()
  const reports = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const published = reports.filter((r) => r.status === 'published').length
  const readyForReview = reports.filter((r) => r.status === 'ready_for_review').length
  const drafts = reports.filter((r) => r.status === 'draft').length

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Reports</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Institutional Reports</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Market briefs, opportunity memos, document readiness summaries, and executive dashboards.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Total Reports</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{reports.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Published</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{published}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Ready for Review</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{readyForReview}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Draft</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{drafts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {[
          {
            href: '/admin/reports/market-briefs',
            label: 'Market Briefs',
            desc: 'Institutional market briefs covering regulatory pathways, buyer demand, and commercial opportunities.',
            count: `${reports.filter((r) => r.report_type === 'market_brief').length} briefs`,
          },
          {
            href: '/admin/reports/opportunity-memos',
            label: 'Opportunity Memos',
            desc: 'Bespoke opportunity analysis memos covering specific counterparties, markets, or categories.',
            count: `${reports.filter((r) => r.report_type === 'opportunity_memo').length} memos`,
          },
          {
            href: '/admin/reports/document-readiness',
            label: 'Document Readiness',
            desc: 'Document readiness summaries with gap analysis and remediation roadmaps.',
            count: `${reports.filter((r) => r.report_type === 'document_readiness_summary').length} summaries`,
          },
          {
            href: '/admin/reports/executive',
            label: 'Executive Dashboard',
            desc: 'Executive-level performance metrics and operational dashboards.',
            count: `${reports.filter((r) => r.report_type === 'executive_dashboard').length} dashboard`,
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{card.count}</p>
            <p className="mt-2 font-semibold text-[#F5F1E8]">{card.label}</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/55">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
