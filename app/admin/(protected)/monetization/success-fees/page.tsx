import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listSuccessFeeOpportunities } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const STATUS_COLOURS: Record<string, string> = {
  identified: 'border-white/20 text-white/50',
  tracking: 'border-sky-400/40 text-sky-300',
  negotiating: 'border-amber-400/40 text-amber-300',
  closed_won: 'border-emerald-400/40 text-emerald-300',
  closed_lost: 'border-red-400/40 text-red-300',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default async function SuccessFeesPage() {
  await requireAdminAuth()
  const result = await listSuccessFeeOpportunities()
  const items = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const pipelineTotal = items
    .filter((s) => s.status !== 'closed_lost')
    .reduce((sum, s) => sum + s.estimated_fee, 0)

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Monetization</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Success Fees</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Tracked success fee opportunities from introductions and deal closings.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Total Opportunities</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{items.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Pipeline Value</p>
          <p className="mt-2 text-2xl font-semibold text-[#F5F1E8]">{fmt(pipelineTotal)}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Active Deals</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">
            {items.filter((s) => s.status === 'tracking' || s.status === 'negotiating').length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {['Title', 'Entity', 'Market', 'Category', 'Fee Basis', 'Estimated Fee', 'Deal Value', 'Probability', 'Status', 'Owner'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F5F1E8]/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-[#F5F1E8]">{item.title}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.entity_label}</td>
                <td className="px-4 py-3 text-[11px] font-medium text-[#C6A55A]">{item.market}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.fee_basis}</td>
                <td className="px-4 py-3 text-[11px] font-semibold text-[#F5F1E8]">{fmt(item.estimated_fee)}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/70">{fmt(item.deal_value)}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]">{Math.round(item.probability * 100)}%</td>
                <td className="px-4 py-3">
                  <Pill label={item.status} cls={STATUS_COLOURS[item.status] ?? 'border-white/20 text-white/50'} />
                </td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
