import { redirect } from 'next/navigation'

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import {
  listEngineReviewQueue,
  countEngineReviewQueue,
  listDistinctEngineCountries,
  approveEngineSignal,
  rejectEngineSignal,
  bulkApproveEngineQueue,
  type EngineQueueFilters,
} from '@/lib/signals-engine/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function buildQuery(country?: string, minScore?: string) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (minScore) params.set('minScore', minScore)
  const qs = params.toString()
  return qs ? `/admin/signals/queue?${qs}` : '/admin/signals/queue'
}

async function approveAction(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  const id = String(formData.get('signal_id') || '')
  const country = String(formData.get('return_country') || '')
  const minScore = String(formData.get('return_min_score') || '')
  await approveEngineSignal(id, auth.user.id)
  redirect(buildQuery(country, minScore))
}

async function rejectAction(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  const id = String(formData.get('signal_id') || '')
  const country = String(formData.get('return_country') || '')
  const minScore = String(formData.get('return_min_score') || '')
  await rejectEngineSignal(id, auth.user.id)
  redirect(buildQuery(country, minScore))
}

async function bulkApproveAction(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  const country = String(formData.get('return_country') || '')
  const minScoreStr = String(formData.get('return_min_score') || '')
  const filters: EngineQueueFilters = {
    country: country || undefined,
    minScore: minScoreStr ? Number(minScoreStr) : undefined,
  }
  await bulkApproveEngineQueue(filters, auth.user.id)
  redirect(buildQuery(country, minScoreStr))
}

function scoreColor(score: number | null) {
  const s = score ?? 0
  if (s >= 70) return 'text-emerald-300'
  if (s >= 55) return 'text-[#C6A55A]'
  return 'text-[#F5F1E8]/55'
}

export default async function EngineSignalQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; minScore?: string }>
}) {
  await requireAdminAuth()
  const params = await searchParams
  const country = params.country || undefined
  const minScore = params.minScore ? Number(params.minScore) : 50

  const filters: EngineQueueFilters = { country, minScore, limit: 50 }

  const [queueResult, countResult, countriesResult] = await Promise.all([
    listEngineReviewQueue(filters),
    countEngineReviewQueue(filters),
    listDistinctEngineCountries(),
  ])

  const queue = queueResult.ok ? queueResult.data ?? [] : []
  const totalPending = countResult.ok ? countResult.data : null
  const countries = countriesResult.ok
    ? Array.from(new Set((countriesResult.data ?? []).map((r) => r.country).filter(Boolean))).sort()
    : []

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Engine signal review queue</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Automated pipeline output (source_registry → source_snapshots → signals, cat=SOURCE_ENGINE). This is separate
          from the regulatory signal review below — that queue reviews manually-curated entries; this one reviews what
          the crawler actually produces. Approve marks reviewed=true so it surfaces on the relevant country&apos;s Intel
          tab. Reject hides it permanently without deleting the row.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <a className="text-[#C6A55A] underline" href="/admin/signals">Summary</a>
        <a className="text-[#C6A55A] underline" href="/admin/signals/sources">Sources</a>
        <a className="text-[#C6A55A] underline" href="/admin/signals/review">Regulatory review (curated)</a>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-[0.14em] text-[#F5F1E8]/55">Country</label>
          <select name="country" defaultValue={country ?? ''} className="rounded-xl border border-white/10 bg-black/30 p-2 text-sm text-[#F5F1E8]">
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c ?? ''}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-[0.14em] text-[#F5F1E8]/55">Min score</label>
          <input
            type="number"
            name="minScore"
            defaultValue={minScore}
            min={0}
            max={100}
            className="w-24 rounded-xl border border-white/10 bg-black/30 p-2 text-sm text-[#F5F1E8]"
          />
        </div>
        <button className="rounded-full border border-white/15 px-4 py-2 text-sm">Apply filters</button>
        <div className="ml-auto text-sm text-[#F5F1E8]/65">
          {totalPending !== null ? `${totalPending} pending in this filter` : ''} · showing up to {queue.length}
        </div>
      </form>

      {queue.length > 0 && (
        <form action={bulkApproveAction} className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-4">
          <input type="hidden" name="return_country" value={country ?? ''} />
          <input type="hidden" name="return_min_score" value={minScore} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#F5F1E8]/70">
              Bulk-approve everything matching this filter{country ? ` (${country})` : ''} scoring {minScore}+
              {totalPending !== null ? ` — ${totalPending} signal${totalPending === 1 ? '' : 's'}` : ''}.
            </p>
            <button className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-semibold text-[#071423]">
              Approve all shown
            </button>
          </div>
        </form>
      )}

      {queue.length === 0 ? (
        <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-10 text-center">
          <p className="text-sm text-[#F5F1E8]/55">No engine signals pending review for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((signal) => (
            <article key={signal.id} className="rounded-2xl border border-[#C6A55A]/10 bg-[#071423] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/42">
                <span className={scoreColor(signal.score)}>score {signal.score ?? '—'}</span>
                {' · '}{signal.country || 'unattributed'}{' · '}{signal.source || 'unknown source'}
                {signal.date ? ` · ${new Date(signal.date).toLocaleDateString()}` : ''}
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-snug">{signal.headline}</h3>
              {signal.summary && (
                <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{signal.summary}</p>
              )}
              {signal.url && (
                <a href={signal.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#C6A55A] underline">
                  View source →
                </a>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={approveAction}>
                  <input type="hidden" name="signal_id" value={signal.id} />
                  <input type="hidden" name="return_country" value={country ?? ''} />
                  <input type="hidden" name="return_min_score" value={minScore} />
                  <button className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm text-emerald-300">
                    Approve
                  </button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="signal_id" value={signal.id} />
                  <input type="hidden" name="return_country" value={country ?? ''} />
                  <input type="hidden" name="return_min_score" value={minScore} />
                  <button className="rounded-full border border-red-300/35 px-4 py-2 text-sm text-red-200">
                    Reject
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
