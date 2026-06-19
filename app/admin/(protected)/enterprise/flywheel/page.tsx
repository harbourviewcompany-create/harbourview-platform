import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listDataFlywheelEvents } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function impactPill(impact: string) {
  switch (impact) {
    case 'high':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'medium':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'low':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

export default async function FlywheelPage() {
  await requireAdminAuth()

  const result = await listDataFlywheelEvents()
  const events = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Data Flywheel</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Incoming events enriching the ecosystem dataset — intake, signals, intros, and outcomes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FixtureBanner isFixture={isFixture} />
          <Link
            href="/admin/enterprise"
            className="text-xs text-zinc-500 hover:text-[#C6A55A] transition-colors"
          >
            ← Overview
          </Link>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Event Type</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Description</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Impact</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Market</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Category</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Dataset Enriched</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-zinc-300 text-xs font-mono">
                    {e.event_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs">{e.description}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${impactPill(e.impact)}`}>
                      {e.impact}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">{e.market}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{e.category}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{e.dataset_enriched}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(e.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
