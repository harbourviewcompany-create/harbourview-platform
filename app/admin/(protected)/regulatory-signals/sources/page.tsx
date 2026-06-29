import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createRegulatorySource, listRegulatorySources } from '@/lib/regulatory-signals/admin'
import { IngestButton } from './IngestButton'

export const dynamic = 'force-dynamic'

async function createSourceAction(formData: FormData) {
  'use server'
  const auth = await requireAdminAuth()
  const result = await createRegulatorySource(formData, auth.user.id)
  if (!result.ok) throw new Error((result as any).error.message)
  redirect('/admin/regulatory-signals/sources')
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function WatchStatusBadge({ status, failures }: { status: string | null; failures?: number }) {
  if (failures && failures > 0) {
    return <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs text-red-300">{failures} fail{failures > 1 ? 's' : ''}</span>
  }
  if (status === 'changed') return <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">changed</span>
  if (status === 'healthy') return <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-300">healthy</span>
  return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[#F5F1E8]/40">pending</span>
}

export default async function RegulatorySourcesPage() {
  await requireAdminAuth()
  const sources = await listRegulatorySources()

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Regulatory Sources</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Source registry for regulatory Signals. Use &ldquo;Ingest Now&rdquo; to fetch a source and run AI signal extraction immediately.
        </p>
      </div>

      <form action={createSourceAction} className="mb-8 grid gap-3 rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5 text-sm md:grid-cols-2">
        <input name="source_name" placeholder="Source name" className="rounded bg-black/30 p-3" required />
        <input name="base_url" placeholder="Base URL" className="rounded bg-black/30 p-3" required />
        <select name="source_tier" className="rounded bg-black/30 p-3" defaultValue="tier_1_official">
          <option value="tier_1_official">Tier 1 official</option>
          <option value="tier_2_professional">Tier 2 professional</option>
          <option value="tier_3_secondary">Tier 3 secondary</option>
        </select>
        <input name="source_type" placeholder="Source type" defaultValue="regulator" className="rounded bg-black/30 p-3" />
        <input name="country_name" placeholder="Country" className="rounded bg-black/30 p-3" />
        <input name="regulator_name" placeholder="Regulator" className="rounded bg-black/30 p-3" />
        <textarea name="validation_notes" placeholder="Validation notes" className="rounded bg-black/30 p-3 md:col-span-2" />
        <button className="rounded-full bg-[#C6A55A] px-5 py-3 font-medium text-[#081423] md:col-span-2">Create Source</button>
      </form>

      {!sources.ok ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">{(sources as any).error.message}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
              <tr>
                <th className="p-4">Source</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Country</th>
                <th className="p-4">Regulator</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last check</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sources.data.length ? sources.data.map((source) => (
                <tr key={source.id} className="text-[#F5F1E8]/75">
                  <td className="p-4">
                    <div className="font-medium text-[#F5F1E8]">{source.source_name}</div>
                    <div className="text-xs text-[#F5F1E8]/45 truncate max-w-[240px]">{source.base_url}</div>
                  </td>
                  <td className="p-4">{source.source_tier}</td>
                  <td className="p-4">{source.country_name || 'Global'}</td>
                  <td className="p-4">{source.regulator_name || '—'}</td>
                  <td className="p-4">
                    <WatchStatusBadge
                      status={source.watch_status}
                      failures={(source as any).consecutive_failures ?? 0}
                    />
                  </td>
                  <td className="p-4 text-xs text-[#F5F1E8]/55">{formatRelativeTime(source.last_checked_at)}</td>
                  <td className="p-4">
                    <IngestButton sourceId={source.id} />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-8 text-center text-[#F5F1E8]/55">No regulatory sources captured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
