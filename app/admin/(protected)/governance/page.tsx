import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listGovernanceQualityItems } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const STATUS_COLOURS: Record<string, string> = {
  approved: 'border-emerald-400/40 text-emerald-300',
  pending_review: 'border-amber-400/40 text-amber-300',
  flagged: 'border-red-400/40 text-red-300',
  incomplete: 'border-slate-400/40 text-slate-400',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const colour = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-[#F5F1E8]">{score}</span>
    </div>
  )
}

export default async function GovernancePage() {
  await requireAdminAuth()
  const result = await listGovernanceQualityItems()
  const items = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const avgScore = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length)
    : 0

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Governance</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Governance & Quality</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Quality governance across data sources, evidence, reports, partners, and commercial actions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Total Items</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{items.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Average Score</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{avgScore}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Flagged</p>
          <p className="mt-2 text-3xl font-semibold text-red-400">{items.filter((i) => i.status === 'flagged').length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Approved</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">{items.filter((i) => i.status === 'approved').length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {['Quality Dimension', 'Title', 'Entity', 'Market', 'Score', 'Status', 'Reviewer', 'Created'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F5F1E8]/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.quality_dimension.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-medium text-[#F5F1E8]">{item.title}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.entity_label}</td>
                <td className="px-4 py-3 text-[11px] font-medium text-[#C6A55A]">{item.market}</td>
                <td className="px-4 py-3">
                  <ScoreBar score={item.score} />
                </td>
                <td className="px-4 py-3">
                  <Pill label={item.status} cls={STATUS_COLOURS[item.status] ?? 'border-white/20 text-white/50'} />
                </td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.reviewer}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/40">
                  {new Date(item.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
