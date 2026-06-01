import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listRegulatorySignals } from '@/lib/regulatory-signals/admin'

export const dynamic = 'force-dynamic'

export default async function RegulatorySignalsAdminPage() {
  await requireAdminAuth()
  const result = await listRegulatorySignals()

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Regulatory Signals</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Admin/operator queue for source-backed policy, regulation and enforcement-change monitoring. No marketplace candidate data is used here.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/regulatory-signals/sources" className="rounded-full border border-[#C6A55A]/50 px-4 py-2 text-sm text-[#C6A55A]">Sources</Link>
          <Link href="/admin/regulatory-signals/new" className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423]">New Signal</Link>
        </div>
      </div>

      {!result.ok ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">{(result as any).error.message}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]"><tr><th className="p-4">Signal</th><th className="p-4">Country</th><th className="p-4">Type</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead>
            <tbody className="divide-y divide-white/10">
              {result.data.length ? result.data.map((signal) => (
                <tr key={signal.id} className="text-[#F5F1E8]/75">
                  <td className="p-4"><Link href={`/admin/regulatory-signals/${signal.id}`} className="font-medium text-[#F5F1E8] underline-offset-4 hover:underline">{signal.headline}</Link></td>
                  <td className="p-4">{signal.country_name || 'Global'}</td>
                  <td className="p-4">{signal.signal_type}</td>
                  <td className="p-4">{signal.review_status}</td>
                  <td className="p-4">{signal.signal_date}</td>
                </tr>
              )) : <tr><td colSpan={5} className="p-8 text-center text-[#F5F1E8]/55">No regulatory Signals captured.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
