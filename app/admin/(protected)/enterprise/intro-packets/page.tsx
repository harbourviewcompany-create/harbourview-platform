import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listIntroPackets } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  switch (status) {
    case 'sent':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'ready_for_review':
      return 'bg-blue-950 text-blue-400 border border-blue-400/20'
    case 'outcome_captured':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
    case 'follow_up_needed':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'draft':
      return 'bg-zinc-800 text-zinc-500 border border-zinc-700'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

function docStatusPill(status: string) {
  switch (status) {
    case 'complete':
      return 'text-emerald-400'
    case 'partial':
      return 'text-amber-400'
    case 'missing':
      return 'text-red-400'
    default:
      return 'text-zinc-400'
  }
}

export default async function IntroPacketsPage() {
  await requireAdminAuth()

  const result = await listIntroPackets()
  const packets = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Intro Packets</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Buyer–seller and counterparty introduction packets with fit and trust scoring
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Title</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Type</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Counterparties</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Market</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Category</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Fit</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Trust</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Docs</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Status</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {packets.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#F5F1E8] font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{p.packet_type}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {p.counterparties.join(' × ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">{p.market}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{p.category}</td>
                  <td className="px-4 py-3 text-zinc-300 font-medium">{p.fit_score}</td>
                  <td className="px-4 py-3 text-zinc-300 font-medium">{p.trust_score}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${docStatusPill(p.documentation_status)}`}>
                      {p.documentation_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusPill(p.status)}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{p.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
