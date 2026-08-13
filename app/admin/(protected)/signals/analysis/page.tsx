import { redirect } from 'next/navigation'

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import {
  listSignalsPendingAnalysis,
  listRecentlyAnalyzedSignals,
  analyzeEngineSignal,
} from '@/lib/signals-engine/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function analyzeAction(formData: FormData) {
  'use server'
  await requireAdminAuth()
  const id = String(formData.get('signal_id') || '')
  // Blocks server-side until the LLM call resolves (or ~30s worst-case
  // timeout) -- see analyzeEngineSignal's own comment. No client JS or
  // polling needed; the browser's native form-pending state covers the
  // wait, same as Approve/Reject on the review queue.
  await analyzeEngineSignal(id)
  redirect('/admin/signals/analysis')
}

function scoreColor(score: number | null) {
  const s = score ?? 0
  if (s >= 70) return 'text-emerald-300'
  if (s >= 55) return 'text-[#C6A55A]'
  return 'text-[#F5F1E8]/55'
}

export default async function SignalAnalysisPage() {
  await requireAdminAuth()

  const [pendingResult, recentResult] = await Promise.all([
    listSignalsPendingAnalysis(30),
    listRecentlyAnalyzedSignals(10),
  ])

  const pending = pendingResult.ok ? pendingResult.data ?? [] : []
  const recent = recentResult.ok ? recentResult.data ?? [] : []
  const pendingError = pendingResult.ok ? null : pendingResult.error.message

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Signal analysis</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Reviewed signals (reviewed=true) that don&apos;t yet have the LLM-generated synthesis layer -- what
          changed, who&apos;s affected, deadline, recommended action. This runs automatically every 30 minutes
          on the full backlog; use Analyze here to generate one on demand and check quality before waiting for
          the scheduled pass.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a className="text-[#C6A55A] underline" href="/admin/signals">Summary</a>
        <a className="text-[#C6A55A] underline" href="/admin/signals/queue">Review queue</a>
        <a className="text-[#C6A55A] underline" href="/admin/signals/sources">Sources</a>
      </div>

      {recent.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm uppercase tracking-[0.16em] text-[#F5F1E8]/55">Recently analyzed</h3>
          {recent.map((signal) => (
            <article key={signal.id} className="rounded-2xl border border-emerald-400/20 bg-[#0B1A2F] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/42">
                <span className={scoreColor(signal.score)}>score {signal.score ?? '—'}</span>
                {' · '}{signal.country || 'unattributed'}
                {signal.analysis_backend ? ` · ${signal.analysis_backend}` : ''}
              </p>
              <h4 className="mt-2 text-base font-semibold leading-snug">{signal.headline}</h4>
              {signal.analysis && (
                <dl className="mt-3 space-y-2 text-sm leading-6 text-[#F5F1E8]/75">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">What changed</dt>
                    <dd>{signal.analysis.what_changed}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Who&apos;s affected</dt>
                    <dd>{signal.analysis.who_is_affected}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Deadline</dt>
                    <dd>{signal.analysis.deadline || 'None stated'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Recommended action</dt>
                    <dd>{signal.analysis.recommended_action}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Confidence</dt>
                    <dd className="text-[#F5F1E8]/55">{signal.analysis.confidence_rationale}</dd>
                  </div>
                </dl>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.16em] text-[#F5F1E8]/55">
          Awaiting analysis {pending.length > 0 ? `(showing ${pending.length})` : ''}
        </h3>

        {pendingError && (
          <div className="rounded-2xl border border-red-300/25 bg-[#0B1A2F] p-5">
            <p className="text-sm text-red-200">Could not load the queue: {pendingError}</p>
          </div>
        )}

        {!pendingError && pending.length === 0 && (
          <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-10 text-center">
            <p className="text-sm text-[#F5F1E8]/55">Nothing waiting on analysis right now.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-4">
            {pending.map((signal) => (
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
                <div className="mt-4">
                  <form action={analyzeAction}>
                    <input type="hidden" name="signal_id" value={signal.id} />
                    <button className="rounded-full border border-[#C6A55A]/50 px-4 py-2 text-sm text-[#C6A55A]">
                      Analyze
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
