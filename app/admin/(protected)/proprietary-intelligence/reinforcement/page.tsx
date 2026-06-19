import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listReinforcementEvents } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

export default async function ReinforcementPage() {
  await requireAdminAuth()
  const result = await listReinforcementEvents()
  const events = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Reinforcement Events</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Signal events that update entity scores and relationship intelligence.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Event Type</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Entity</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Market</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Category</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Score Impact</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Operator</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-[#F5F1E8]/80 font-mono text-xs">{ev.event_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#F5F1E8]">{ev.entity_label}</p>
                  <p className="text-xs text-[#F5F1E8]/40">{ev.entity_type}</p>
                </td>
                <td className="px-4 py-3 text-[#F5F1E8]/70">{ev.market}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs">{ev.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  <span className={ev.score_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {ev.score_impact >= 0 ? '+' : ''}{ev.score_impact}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#F5F1E8]/50 text-xs">{ev.operator}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/50 text-xs">
                  {new Date(ev.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#F5F1E8]/40">No reinforcement events found.</p>
        )}
      </div>
    </section>
  )
}
