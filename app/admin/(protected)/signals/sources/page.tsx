import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listRegulatorySourceCheckRuns, listRegulatorySources } from '@/lib/regulatory-signals/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatDate(value: string | null | undefined) {
  if (!value) return 'Never'
  return new Date(value).toISOString().replace('T', ' ').slice(0, 16)
}

function label(value: string | null | undefined) {
  return (value || 'unknown').replace(/_/g, ' ')
}

export default async function AdminSignalSourcesPage() {
  await requireAdminAuth()
  const [sourcesResult, runsResult] = await Promise.all([listRegulatorySources(), listRegulatorySourceCheckRuns(20)])
  const sources = sourcesResult.ok ? sourcesResult.data ?? [] : []
  const runs = runsResult.ok ? runsResult.data ?? [] : []

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Regulatory source registry</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">Seeded official sources, watcher status, last check time, and latest private check-run evidence.</p>
      </div>
      <div className="flex gap-3 text-sm"><a className="text-[#C6A55A] underline" href="/admin/signals">Summary</a><a className="text-[#C6A55A] underline" href="/admin/signals/review">Review queue</a></div>
      <div className="overflow-x-auto rounded-2xl border border-[#C6A55A]/10 bg-[#071423] p-5">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/45"><tr><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Jurisdiction</th><th className="py-3 pr-4">Method</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Last checked</th></tr></thead>
          <tbody>{sources.map((source) => <tr key={source.id} className="border-t border-white/10"><td className="py-3 pr-4"><p className="font-semibold">{source.source_name}</p><a className="break-all text-xs text-[#C6A55A] underline" href={source.watch_url || source.rss_url || source.base_url} target="_blank" rel="noreferrer">{source.watch_url || source.rss_url || source.base_url}</a>{source.last_error && <p className="mt-2 text-xs text-red-300">{source.last_error}</p>}</td><td className="py-3 pr-4 text-[#F5F1E8]/65">{source.country_name || '—'} · {source.jurisdiction || '—'}</td><td className="py-3 pr-4 text-[#F5F1E8]/65">{label(source.access_method)}</td><td className="py-3 pr-4 text-[#F5F1E8]/65">{label(source.watch_status)}</td><td className="py-3 pr-4 text-[#F5F1E8]/65">{formatDate(source.last_checked_at)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#071423] p-5">
        <h3 className="mb-4 text-lg font-semibold">Latest check runs</h3>
        {runs.length === 0 ? <p className="text-sm text-[#F5F1E8]/55">No check runs recorded yet.</p> : <div className="space-y-3">{runs.map((run) => <div key={run.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="text-sm">{formatDate(run.checked_at)} · {label(run.status)} · HTTP {run.http_status ?? '—'} · changed {run.changed ? 'yes' : 'no'}</p>{run.error_message && <p className="mt-2 text-xs text-red-300">{run.error_message}</p>}</div>)}</div>}
      </div>
    </section>
  )
}
