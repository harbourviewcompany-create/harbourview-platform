import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listInstitutionalWorkflows } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  review_ready: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  incomplete: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  flagged: 'bg-red-500/15 text-red-400 border border-red-500/25',
}

export default async function InstitutionalWorkflowsPage() {
  await requireAdminAuth()
  const result = await listInstitutionalWorkflows()
  const workflows = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Institutional Workflows</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Structured workflow records for market access, onboarding, and compliance review.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {workflows.map((wf) => {
          const completed = wf.workflow_steps.filter((s) => s.completed).length
          const total = wf.workflow_steps.length
          return (
            <div key={wf.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#F5F1E8]">{wf.title}</p>
                  <div className="mt-1 flex gap-2 text-xs text-[#F5F1E8]/50">
                    <span>{wf.market}</span>
                    <span>·</span>
                    <span>{wf.category.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColors[wf.status] ?? statusColors.incomplete}`}>
                  {wf.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#F5F1E8]/50">
                  <span>Completeness</span>
                  <span>{completed}/{total} steps · {wf.completeness_pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#C6A55A]"
                    style={{ width: `${wf.completeness_pct}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-1.5">
                {wf.workflow_steps.map((step) => (
                  <li key={step.key} className="flex items-center gap-2 text-xs">
                    <span className={`w-3.5 h-3.5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${step.completed ? 'bg-emerald-500 text-white' : 'bg-white/10 text-[#F5F1E8]/30'}`}>
                      {step.completed ? '✓' : '○'}
                    </span>
                    <span className={step.completed ? 'text-[#F5F1E8]/70' : 'text-[#F5F1E8]/35'}>{step.label}</span>
                  </li>
                ))}
              </ul>

              {wf.analyst_notes && (
                <p className="text-xs text-[#F5F1E8]/50 border-t border-white/10 pt-3">{wf.analyst_notes}</p>
              )}
            </div>
          )
        })}
      </div>
      {workflows.length === 0 && (
        <p className="text-center text-sm text-[#F5F1E8]/40 py-8">No institutional workflows found.</p>
      )}
    </section>
  )
}
