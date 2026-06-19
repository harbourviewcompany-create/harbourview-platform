import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listReputationRecords } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  switch (status) {
    case 'priority':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'standard':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
    case 'watch_carefully':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'reengage_later':
      return 'bg-red-950 text-red-400 border border-red-400/20'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-amber-400'
  return 'text-red-400'
}

export default async function ReputationPage() {
  await requireAdminAuth()

  const result = await listReputationRecords()
  const records = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Reputation Records</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Trust scores, responsiveness, document quality, and relationship value tracking
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
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Entity</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Type</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Market</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Category</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Trust</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Response</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Doc Quality</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Intro Quality</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Reliability</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#F5F1E8] font-medium">{r.entity_label}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{r.entity_type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">{r.market}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{r.category}</td>
                  <td className={`px-4 py-3 font-semibold ${scoreColor(r.trust_score)}`}>{r.trust_score}</td>
                  <td className={`px-4 py-3 ${scoreColor(r.responsiveness)}`}>{r.responsiveness}</td>
                  <td className={`px-4 py-3 ${scoreColor(r.document_quality)}`}>{r.document_quality}</td>
                  <td className={`px-4 py-3 ${scoreColor(r.intro_quality)}`}>{r.intro_quality}</td>
                  <td className={`px-4 py-3 ${scoreColor(r.reliability)}`}>{r.reliability}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusPill(r.status)}`}>
                      {r.status.replace(/_/g, ' ')}
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
