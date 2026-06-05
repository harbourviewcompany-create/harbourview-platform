'use client'

import { useState } from 'react'

type Candidate = {
  id: string
  title_internal: string
  description_internal: string
  marketplace_category: string
  status: string
  discovered_at: string
  raw_payload: {
    contact_name?: string
    contact_email?: string
    contact_company?: string
    contact_phone?: string
    listing_type?: string
    raw_message?: string
  } | null
}

type Inquiry = {
  id: string
  inquiry_type: string
  contact_name: string
  contact_email: string
  contact_company: string | null
  message: string
  review_status: string | null
  created_at: string
}

export default function IntakeQueueClient({
  candidates,
  inquiries,
  configError,
}: {
  candidates: Record<string, unknown>[]
  inquiries: Record<string, unknown>[]
  configError: string | null
}) {
  const [items, setItems] = useState<Candidate[]>(candidates as unknown as Candidate[])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'candidates' | 'inquiries'>('candidates')
  const [editTitle, setEditTitle] = useState<Record<string, string>>({})

  async function act(id: string, action: 'approve' | 'reject', title?: string) {
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          fields: title ? { title } : undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setItems(prev => prev.filter(c => c.id !== id))
        setFeedback(prev => ({ ...prev, [id]: `✓ ${action === 'approve' ? 'Published' : 'Rejected'}` }))
      } else {
        setFeedback(prev => ({ ...prev, [id]: `Error: ${data?.error ?? res.statusText}` }))
      }
    } catch (e) {
      setFeedback(prev => ({ ...prev, [id]: `Network error` }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#07111F] p-6 text-[#F5F1E8]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C6A55A]/70">
              Harbourview Admin
            </p>
            <h1 className="text-2xl font-semibold">Marketplace Intake Queue</h1>
            <p className="mt-1 text-sm text-[#F5F1E8]/50">
              Review seller submissions. Approve to publish to public marketplace.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-[#F5F1E8]/60 hover:border-white/20 hover:text-[#F5F1E8]/80"
          >
            ← Admin
          </a>
        </div>

        {configError && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-sm text-red-300">
            {configError}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-[#0B1A2F] p-1 w-fit">
          {(['candidates', 'inquiries'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-[#C6A55A]/20 text-[#C6A55A]'
                  : 'text-[#F5F1E8]/50 hover:text-[#F5F1E8]/80'
              }`}
            >
              {t === 'candidates'
                ? `Pending Review (${items.length})`
                : `All Inquiries (${inquiries.length})`}
            </button>
          ))}
        </div>

        {/* Candidates tab */}
        {tab === 'candidates' && (
          <div className="space-y-3">
            {items.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0B1A2F] p-8 text-center text-[#F5F1E8]/40">
                No pending intake submissions.
              </div>
            )}
            {items.map(c => {
              const payload = c.raw_payload ?? {}
              const isOpen = expanded === c.id
              const fb = feedback[c.id]
              const currentTitle = editTitle[c.id] ?? c.title_internal

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/10 bg-[#0B1A2F] overflow-hidden"
                >
                  {/* Row header */}
                  <div
                    className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-white/[0.02]"
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-[#F5F1E8]">{c.title_internal}</p>
                      <p className="text-xs text-[#F5F1E8]/40 mt-0.5">
                        {c.marketplace_category} · {payload.contact_company || payload.contact_name || 'Unknown'} ·{' '}
                        {new Date(c.discovered_at).toLocaleDateString()}
                      </p>
                    </div>
                    {fb ? (
                      <span className="text-sm text-[#C6A55A]">{fb}</span>
                    ) : (
                      <span className="text-xs text-[#F5F1E8]/30">{isOpen ? '▲' : '▼'}</span>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isOpen && !fb && (
                    <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-4">
                      {/* Contact */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-1">Contact</p>
                          <p>{payload.contact_name || '—'}</p>
                          <p className="text-[#F5F1E8]/50">{payload.contact_email || '—'}</p>
                          {payload.contact_company && <p className="text-[#F5F1E8]/50">{payload.contact_company}</p>}
                          {payload.contact_phone && <p className="text-[#F5F1E8]/50">{payload.contact_phone}</p>}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-1">Category</p>
                          <p>{c.marketplace_category}</p>
                          {payload.listing_type && <p className="text-[#F5F1E8]/50">{payload.listing_type}</p>}
                        </div>
                      </div>

                      {/* Raw message */}
                      {payload.raw_message && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-2">Submission</p>
                          <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-[#F5F1E8]/70 font-mono leading-5 max-h-48 overflow-y-auto">
                            {payload.raw_message}
                          </pre>
                        </div>
                      )}

                      {/* Editable public title */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-2">
                          Public Title (edit before approving)
                        </p>
                        <input
                          value={currentTitle}
                          onChange={e => setEditTitle(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/50"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button
                          disabled={!!busy}
                          onClick={() => act(c.id, 'approve', currentTitle)}
                          className="rounded-lg bg-[#C6A55A] px-5 py-2 text-sm font-semibold text-[#07111F] hover:bg-[#d4b468] disabled:opacity-40 transition-colors"
                        >
                          {busy === c.id ? 'Publishing…' : '✓ Approve & Publish'}
                        </button>
                        <button
                          disabled={!!busy}
                          onClick={() => act(c.id, 'reject')}
                          className="rounded-lg border border-red-500/30 px-5 py-2 text-sm text-red-400 hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Inquiries tab — all raw submissions */}
        {tab === 'inquiries' && (
          <div className="space-y-3">
            {(inquiries as Inquiry[]).length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0B1A2F] p-8 text-center text-[#F5F1E8]/40">
                No inquiries yet.
              </div>
            )}
            {(inquiries as Inquiry[]).map(inq => (
              <div key={inq.id} className="rounded-xl border border-white/10 bg-[#0B1A2F] overflow-hidden">
                <div
                  className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-white/[0.02]"
                  onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-[#F5F1E8]">
                      {inq.contact_company || inq.contact_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-[#F5F1E8]/40 mt-0.5">
                      {inq.inquiry_type} · {inq.contact_email} · {new Date(inq.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inq.review_status === 'reviewed'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-yellow-900/30 text-yellow-400'
                  }`}>
                    {inq.review_status || 'pending'}
                  </span>
                </div>
                {expanded === inq.id && (
                  <div className="border-t border-white/10 px-5 pb-5 pt-4">
                    <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-1">Contact</p>
                        <p>{inq.contact_name}</p>
                        <p className="text-[#F5F1E8]/50">{inq.contact_email}</p>
                        {inq.contact_company && <p className="text-[#F5F1E8]/50">{inq.contact_company}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-1">Type</p>
                        <p>{inq.inquiry_type}</p>
                      </div>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-[#C6A55A]/60 mb-2">Message</p>
                    <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-[#F5F1E8]/70 font-mono leading-5 max-h-48 overflow-y-auto">
                      {inq.message}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
