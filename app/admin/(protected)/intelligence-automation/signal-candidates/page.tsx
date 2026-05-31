import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listSignalCandidates } from '@/lib/intelligence-automation/db'
import { SignalCandidateActions } from './SignalCandidateActions'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  needs_review:                  'text-amber-400 border-amber-400/30 bg-amber-400/10',
  needs_source_check:            'text-amber-300 border-amber-300/30 bg-amber-300/10',
  needs_contact_enrichment:      'text-sky-400 border-sky-400/30 bg-sky-400/10',
  needs_compliance_review:       'text-orange-400 border-orange-400/30 bg-orange-400/10',
  needs_pricing_check:           'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  priority_review:               'text-red-400 border-red-400/30 bg-red-400/10',
  approved:                      'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  rejected:                      'text-red-500/80 border-red-500/20 bg-red-500/5',
  duplicate:                     'text-[#F5F1E8]/35 border-white/12 bg-white/5',
  archived:                      'text-[#F5F1E8]/25 border-white/10 bg-white/3',
  ready_for_outreach:            'text-purple-400 border-purple-400/30 bg-purple-400/10',
  outreach_sent:                 'text-purple-300 border-purple-300/30 bg-purple-300/10',
  converted_to_listing:          'text-teal-400 border-teal-400/30 bg-teal-400/10',
  converted_to_supplier:         'text-teal-300 border-teal-300/30 bg-teal-300/10',
  converted_to_wanted_request:   'text-blue-400 border-blue-400/30 bg-blue-400/10',
  converted_to_dossier:          'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
}

const REVIEW_ORDER = [
  'priority_review','needs_review','needs_source_check','needs_contact_enrichment',
  'needs_compliance_review','needs_pricing_check','approved','ready_for_outreach',
  'outreach_sent','converted_to_listing','converted_to_supplier','converted_to_wanted_request',
  'converted_to_dossier','rejected','duplicate','archived',
]

function scoreColor(score: number | null): string {
  if (score === null) return 'text-[#F5F1E8]/30'
  if (score >= 0.75) return 'text-emerald-400'
  if (score >= 0.5)  return 'text-amber-400'
  return 'text-red-400'
}

export default async function SignalCandidatesPage() {
  await requireAdminAuth()
  const result = await listSignalCandidates()

  const isEmpty = !result.ok || result.data.length === 0
  const candidates = result.ok ? result.data : []
  const isLive = result.ok

  const sorted = [...candidates].sort(
    (a, b) => REVIEW_ORDER.indexOf(a.status) - REVIEW_ORDER.indexOf(b.status),
  )

  const statusCounts = REVIEW_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = candidates.filter(c => c.status === s).length
    return acc
  }, {})

  const needsActionCount = candidates.filter(c =>
    ['needs_review','priority_review','needs_source_check'].includes(c.status),
  ).length

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation · Signal engine</p>
          <h2 className="mt-1 text-2xl font-semibold">Signal Candidates</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Signal candidate review queue. Extracted from source documents via the signal engine.
            Approve, reject, or convert to marketplace records.{' '}
            <span className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLive ? (isEmpty ? 'Live — no candidates yet' : 'Live — Supabase') : 'Signal engine tables not yet applied'}
            </span>
          </p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          ← Intelligence hub
        </Link>
      </div>

      {/* Status summary bar */}
      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {REVIEW_ORDER.filter(s => (statusCounts[s] ?? 0) > 0).map(s => (
            <div key={s} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${statusColors[s] ?? ''}`}>
              {statusCounts[s]} {s.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
      )}

      {/* Needs action banner */}
      {needsActionCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3">
          <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            {needsActionCount} candidate{needsActionCount !== 1 ? 's' : ''} need immediate review.
          </p>
        </div>
      )}

      {/* Empty state — signal engine not yet populated */}
      {isEmpty && (
        <div className="rounded-2xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-8">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#C6A55A]/50 mb-3">Signal engine status</p>
          <h3 className="text-lg font-semibold text-[#F5F1E8] mb-2">
            {isLive ? 'No signal candidates yet' : 'Signal engine tables not applied'}
          </h3>
          <p className="text-sm text-[#F5F1E8]/55 leading-7 max-w-2xl">
            {isLive
              ? 'The signal engine schema is applied and the table is live. Candidates will appear here once source documents are processed and signals are extracted. The signal processing pipeline (source ingestion → chunking → classification → candidate generation) needs to run first.'
              : 'The signal_candidates table from migration 20260430000001_signal_engine_schema.sql needs to be applied to the Supabase project. Once applied, this queue will show candidates extracted from source documents via the signal processing pipeline.'}
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs text-[#F5F1E8]/50">
            <p className="mb-1 text-[#C6A55A]/60">Signal engine tables required:</p>
            <p>source_documents · source_chunks · signal_candidates</p>
            <p>signal_evidence · signal_review_events · signal_jobs</p>
            <p>signal_risk_flags · entities · signal_entity_mentions</p>
            <p>signal_conversions · model_call_logs · model_prompt_versions</p>
          </div>
        </div>
      )}

      {/* Candidate list */}
      {!isEmpty && (
        <div className="space-y-3">
          {sorted.map(cand => (
            <div key={cand.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${statusColors[cand.status] ?? ''}`}>
                      {cand.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#F5F1E8]/45">{cand.signal_type.replace(/_/g, ' ')}</span>
                    {cand.marketplace_category && (
                      <span className="text-xs text-[#F5F1E8]/35">{cand.marketplace_category.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-[#F5F1E8]">{cand.title}</h3>
                  {cand.summary && (
                    <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/60 line-clamp-2">{cand.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#F5F1E8]/50">
                    {cand.jurisdiction_country && (
                      <span>Country: <strong className="text-[#F5F1E8]/70">{cand.jurisdiction_country}</strong></span>
                    )}
                    {cand.inferred_company_name && (
                      <span>Company: <strong className="text-[#F5F1E8]/70">{cand.inferred_company_name}</strong></span>
                    )}
                    {cand.inferred_product_type && (
                      <span>Product: <strong className="text-[#F5F1E8]/70">{cand.inferred_product_type}</strong></span>
                    )}
                    <span className="text-[#F5F1E8]/30">{cand.created_at.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {/* Score indicators */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Conf', value: cand.model_confidence_score },
                      { label: 'Score', value: cand.final_signal_score },
                      { label: 'Rel', value: cand.commercial_relevance_score },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
                        <p className="text-[8px] uppercase tracking-[0.1em] text-[#C6A55A]/55">{s.label}</p>
                        <p className={`text-sm font-semibold ${scoreColor(s.value)}`}>
                          {s.value !== null ? Math.round(s.value * 100) : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <SignalCandidateActions candidateId={cand.id} currentStatus={cand.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
