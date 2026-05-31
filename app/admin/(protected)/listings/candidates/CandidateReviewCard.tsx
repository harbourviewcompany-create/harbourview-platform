// app/admin/(protected)/listings/candidates/CandidateReviewCard.tsx
'use client'

import { useState } from 'react'

type Candidate = {
  id: string
  source_name: string
  source_url: string
  marketplace_category: string
  title_internal: string
  title_public_draft: string
  description_internal: string
  description_public_draft: string
  product_type: string | null
  region: string | null
  country: string | null
  price_raw: string | null
  price_amount: number | null
  price_currency: string | null
  condition: string | null
  confidence: number | null
  discovered_at: string
  ai_normalised: Record<string, unknown> | null
}

type ActionState = 'idle' | 'submitting' | 'approved' | 'rejected' | 'error'

export default function CandidateReviewCard({ candidate }: { candidate: Candidate }) {
  const [state, setState] = useState<ActionState>('idle')
  const [publicTitle, setPublicTitle] = useState(candidate.title_public_draft || candidate.title_internal)
  const [publicDesc, setPublicDesc] = useState(candidate.description_public_draft || candidate.description_internal)
  const [expanded, setExpanded] = useState(false)

  async function handleAction(action: 'approve' | 'reject') {
    setState('submitting')
    try {
      const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          fields: action === 'approve' ? { title: publicTitle, description: publicDesc } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setState(action === 'approve' ? 'approved' : 'rejected')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  if (state === 'approved') {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-950/20 px-6 py-4 text-sm text-green-400">
        ✓ Approved and published to marketplace — <strong>{publicTitle}</strong>
      </div>
    )
  }
  if (state === 'rejected') {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B1A2F]/60 px-6 py-4 text-sm text-[#F5F1E8]/40 line-through">
        Rejected: {candidate.title_internal}
      </div>
    )
  }

  const confidence = candidate.confidence ? Math.round(candidate.confidence * 100) : null
  const confidenceColor = confidence && confidence >= 75 ? '#059669' : confidence && confidence >= 50 ? '#d97706' : '#dc2626'

  return (
    <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">
            {candidate.marketplace_category?.replace(/_/g, ' ')} · {candidate.source_name}
          </p>
          <h3 className="text-xl font-semibold text-[#F5F1E8]">{candidate.title_internal}</h3>
        </div>
        <div className="flex items-center gap-3">
          {confidence !== null && (
            <span style={{ color: confidenceColor }} className="text-sm font-semibold">
              {confidence}% confidence
            </span>
          )}
          <a
            href={candidate.source_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-xs font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/10"
          >
            View source ↗
          </a>
        </div>
      </div>

      <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Category', candidate.marketplace_category],
          ['Product type', candidate.product_type],
          ['Region', candidate.region],
          ['Condition', candidate.condition],
          ['Price (raw)', candidate.price_raw],
          ['Country', candidate.country],
          ['Discovered', new Date(candidate.discovered_at).toLocaleDateString('en-CA')],
        ].map(([label, value]) =>
          value ? (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[#C6A55A]">{label}</span>
              <span className="mt-1 block text-[#F5F1E8]/75">{value}</span>
            </div>
          ) : null,
        )}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">Raw description</p>
          <p className="text-sm leading-6 text-[#F5F1E8]/65">{candidate.description_internal?.slice(0, 300)}</p>
        </div>
        <div className="rounded-xl border border-[#C6A55A]/20 bg-black/15 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">AI public draft</p>
          <p className="text-sm leading-6 text-[#F5F1E8]/65">{candidate.description_public_draft?.slice(0, 300)}</p>
        </div>
      </div>

      {/* Editable public fields */}
      <div className="mb-5 space-y-4">
        <label className="block text-sm text-[#F5F1E8]/70">
          Public title (edit before approving)
          <input
            value={publicTitle}
            onChange={(e) => setPublicTitle(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
          />
        </label>
        <label className="block text-sm text-[#F5F1E8]/70">
          Public description (edit before approving)
          <textarea
            rows={3}
            value={publicDesc}
            onChange={(e) => setPublicDesc(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleAction('approve')}
          disabled={state === 'submitting'}
          className="rounded-full bg-[#C6A55A] px-5 py-2.5 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-60"
        >
          {state === 'submitting' ? 'Publishing…' : '✓ Approve & publish'}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={state === 'submitting'}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-[#F5F1E8]/60 transition hover:border-white/40 hover:text-[#F5F1E8] disabled:opacity-60"
        >
          ✗ Reject
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto text-xs text-[#F5F1E8]/40 underline-offset-4 hover:text-[#F5F1E8]/70 hover:underline"
        >
          {expanded ? 'Hide' : 'Show'} AI payload
        </button>
      </div>

      {expanded && candidate.ai_normalised && (
        <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-[11px] text-[#F5F1E8]/50">
          {JSON.stringify(candidate.ai_normalised, null, 2)}
        </pre>
      )}

      {state === 'error' && (
        <p className="mt-3 text-sm text-red-400">Action failed — please try again.</p>
      )}
    </article>
  )
}
