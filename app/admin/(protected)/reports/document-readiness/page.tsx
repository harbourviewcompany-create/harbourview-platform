import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listInstitutionalReports } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const STATUS_COLOURS: Record<string, string> = {
  draft: 'border-white/20 text-white/50',
  ready_for_review: 'border-amber-400/40 text-amber-300',
  published: 'border-emerald-400/40 text-emerald-300',
  shared: 'border-sky-400/40 text-sky-300',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default async function DocumentReadinessPage() {
  await requireAdminAuth()
  const result = await listInstitutionalReports()
  const allReports = result.ok ? result.data : []
  const reports = allReports.filter((r) => r.report_type === 'document_readiness_summary')
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Reports</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Document Readiness</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Document readiness summaries with gap analysis and remediation roadmaps for market entry.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{report.market}</p>
              <h3 className="mt-1 font-semibold text-[#F5F1E8]">{report.title}</h3>
              <p className="mt-0.5 text-xs text-[#F5F1E8]/50">{report.category.replace(/_/g, ' ')}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40">Completeness</p>
                <span className="text-xs font-semibold text-[#F5F1E8]">{report.completeness_pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#C6A55A]"
                  style={{ width: `${report.completeness_pct}%` }}
                />
              </div>
            </div>

            {report.sections.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">Sections</p>
                <ul className="space-y-0.5">
                  {report.sections.map((section, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-[#F5F1E8]/60">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/60" />
                      {section}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Pill label={report.status} cls={STATUS_COLOURS[report.status] ?? 'border-white/20 text-white/50'} />
              <span className="text-[10px] text-[#F5F1E8]/40">
                Updated {new Date(report.last_updated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
