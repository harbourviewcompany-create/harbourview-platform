import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listEcosystemVerticals } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'building':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'underbuilt':
      return 'bg-red-950 text-red-400 border border-red-400/20'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

export default async function EcosystemVerticalsPage() {
  await requireAdminAuth()

  const result = await listEcosystemVerticals()
  const verticals = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Ecosystem Verticals</h1>
          <p className="mt-1 text-sm text-zinc-400">
            All operator verticals, record counts, market and category coverage
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
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Name</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Vertical Type</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Records</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Markets</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Categories</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">High Value</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {verticals.map((v) => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#F5F1E8] font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{v.vertical_type}</td>
                  <td className="px-4 py-3 text-zinc-300">{v.record_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.markets_covered.map((m) => (
                        <span key={m} className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.categories_covered.map((c) => (
                        <span key={c} className="rounded px-1.5 py-0.5 text-xs bg-zinc-800/60 text-zinc-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{v.high_value_count}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusPill(v.status)}`}>
                      {v.status}
                    </span>
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
