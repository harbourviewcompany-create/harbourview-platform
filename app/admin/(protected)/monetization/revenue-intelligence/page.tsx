import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listRevenueIntelligenceItems } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const STAGE_COLOURS: Record<string, string> = {
  identified: 'border-white/20 text-white/50',
  qualified: 'border-sky-400/40 text-sky-300',
  proposal: 'border-amber-400/40 text-amber-300',
  negotiation: 'border-violet-400/40 text-violet-300',
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

export default async function RevenueIntelligencePage() {
  await requireAdminAuth()
  const result = await listRevenueIntelligenceItems()
  const items = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Monetization</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Revenue Intelligence</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Active revenue opportunities across all revenue types and pipeline stages.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {['Title', 'Revenue Type', 'Entity', 'Market', 'Category', 'Expected ($)', 'Deal Value ($)', 'Success Fee ($)', 'Probability', 'Stage', 'Owner'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F5F1E8]/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#F5F1E8]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#F5F1E8]/40">{item.next_action}</p>
                </td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.revenue_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.entity_label}</td>
                <td className="px-4 py-3 text-[11px] font-medium text-[#C6A55A]">{item.market}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{item.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]">{fmt(item.expected_revenue)}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/70">{item.estimated_deal_value > 0 ? fmt(item.estimated_deal_value) : '—'}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/70">{item.success_fee_potential > 0 ? fmt(item.success_fee_potential) : '—'}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]">{Math.round(item.conversion_probability * 100)}%</td>
                <td className="px-4 py-3">
                  <Pill label={item.stage} cls={STAGE_COLOURS[item.stage] ?? 'border-white/20 text-white/50'} />
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
