'use client'
import { useState } from 'react'
import type { InquiryRow } from './page'

function parseMessage(msg: string | null) {
  if (!msg) return { title: '', type: '', location: '', description: '', fields: {} as Record<string, string> }
  const lines = msg.split('\n')
  const get = (label: string) => {
    const line = lines.find(l => l.toLowerCase().startsWith(label.toLowerCase() + ':'))
    return line ? line.slice(line.indexOf(':') + 1).trim() : ''
  }
  // Extract freeform key: value lines from the body
  const fields: Record<string, string> = {}
  let inFields = false
  for (const line of lines) {
    if (line.startsWith('Harbourview action requested')) break
    if (line.trim() === '' && inFields) continue
    if (line.includes(':') && inFields) {
      const [k, ...v] = line.split(':')
      if (k && v.length) fields[k.trim()] = v.join(':').trim()
    }
    if (line.toLowerCase().startsWith('listing type:') || line.toLowerCase().startsWith('title:')) inFields = true
  }
  // Description block
  const descIdx = lines.findIndex(l => l.trim().toLowerCase() === 'description:')
  const actionIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('harbourview action'))
  const description = descIdx >= 0
    ? lines.slice(descIdx + 1, actionIdx > 0 ? actionIdx : undefined).join('\n').trim()
    : ''

  return {
    title: get('title'),
    type: get('listing type'),
    location: get('location'),
    description,
    fields,
  }
}

function InquiryCard({ row, onAction }: { row: InquiryRow; onAction: (id: string, action: 'publish' | 'reject', data?: Record<string, string>) => Promise<void> }) {
  const parsed = parseMessage(row.message)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editTitle, setEditTitle] = useState(parsed.title || '')
  const [editDesc, setEditDesc] = useState(parsed.description || '')
  const [editType, setEditType] = useState(parsed.type || '')
  const [editCountry, setEditCountry] = useState(parsed.location || '')
  const [editRegion, setEditRegion] = useState('global')

  const statusColor = row.review_status === 'published' ? 'text-green-400 bg-green-950 border-green-800'
    : row.review_status === 'in_review' ? 'text-blue-400 bg-blue-950 border-blue-800'
    : row.review_status === 'rejected' || row.review_status === 'closed' ? 'text-zinc-500 bg-zinc-900 border-zinc-700'
    : 'text-amber-400 bg-amber-950 border-amber-800'

  async function handle(action: 'publish' | 'reject') {
    setBusy(true)
    await onAction(row.id, action, {
      title: editTitle,
      description: editDesc,
      product_type: editType,
      location_country: editCountry,
      region: editRegion,
    })
    setBusy(false)
  }

  const isActionable = !row.review_status || row.review_status === 'received' || row.review_status === 'in_review'

  return (
    <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
              {row.review_status || 'received'}
            </span>
            <span className="text-[10px] text-[#C6A55A]/70 uppercase tracking-wider">{row.inquiry_type?.replace('_', ' ')}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-[#F5F1E8] truncate">
            {editTitle || parsed.title || 'Untitled submission'}
          </p>
          <p className="text-xs text-[#F5F1E8]/50 mt-0.5">
            {row.contact_name}{row.contact_company ? ` · ${row.contact_company}` : ''} · {row.contact_email} · {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className="text-[#F5F1E8]/30 text-lg">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="border-t border-[#C6A55A]/10 p-4 space-y-4">
          {/* Raw message */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#F5F1E8]/40 mb-1">Raw submission</p>
            <pre className="text-xs text-[#F5F1E8]/60 whitespace-pre-wrap leading-5 bg-[#061322] rounded-lg p-3 max-h-40 overflow-y-auto">
              {row.message}
            </pre>
          </div>

          {/* Editable publish fields */}
          {isActionable && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-[#C6A55A]/70">Publish as listing</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 block text-xs text-[#F5F1E8]/60">
                  Title
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/50 outline-none"
                  />
                </label>
                <label className="block text-xs text-[#F5F1E8]/60">
                  Product type
                  <input
                    value={editType}
                    onChange={e => setEditType(e.target.value)}
                    placeholder="e.g. Packaging, Lab Solvents"
                    className="mt-1 w-full rounded-lg border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/50 outline-none"
                  />
                </label>
                <label className="block text-xs text-[#F5F1E8]/60">
                  Country code
                  <input
                    value={editCountry}
                    onChange={e => setEditCountry(e.target.value)}
                    placeholder="e.g. CA, DE, GB"
                    className="mt-1 w-full rounded-lg border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/50 outline-none"
                  />
                </label>
                <label className="block text-xs text-[#F5F1E8]/60">
                  Region
                  <select
                    value={editRegion}
                    onChange={e => setEditRegion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/50 outline-none"
                  >
                    {['global','north_america','europe','asia_pacific','latin_america','middle_east_africa'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 block text-xs text-[#F5F1E8]/60">
                  Public description
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/50 outline-none resize-none"
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handle('publish')}
                  disabled={busy || !editTitle.trim()}
                  className="rounded-lg bg-[#C6A55A] px-5 py-2 text-sm font-semibold text-[#061322] hover:bg-[#D8BC73] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {busy ? 'Publishing…' : '✓ Publish to marketplace'}
                </button>
                <button
                  onClick={() => handle('reject')}
                  disabled={busy}
                  className="rounded-lg border border-red-900/60 px-5 py-2 text-sm font-semibold text-red-400 hover:border-red-700 disabled:opacity-50 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type Props = {
  pending: InquiryRow[]
  inReview: InquiryRow[]
  published: InquiryRow[]
  rejected: InquiryRow[]
}

export default function IntakeQueueClient({ pending, inReview, published, rejected }: Props) {
  const [localStates, setLocalStates] = useState<Record<string, string>>({})

  async function handleAction(id: string, action: 'publish' | 'reject', data?: Record<string, string>) {
    const res = await fetch(`/api/admin/marketplace/inquiries/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? {}),
    })
    if (res.ok) {
      setLocalStates(s => ({ ...s, [id]: action === 'publish' ? 'published' : 'rejected' }))
    } else {
      const body = await res.json().catch(() => ({}))
      alert(`Failed: ${body.error ?? res.statusText}`)
    }
  }

  const allActive = [...pending, ...inReview].filter(r => !localStates[r.id])
  const allDone = [...published, ...rejected, ...allActive.filter(r => localStates[r.id])]

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-[#F5F1E8]/70 uppercase tracking-wider mb-3">
          Needs review <span className="text-[#C6A55A]">{allActive.length}</span>
        </h2>
        {allActive.length === 0 ? (
          <p className="text-sm text-[#F5F1E8]/40 py-6 text-center">No pending submissions.</p>
        ) : (
          <div className="space-y-3">
            {allActive.map(r => (
              <InquiryCard key={r.id} row={{ ...r, review_status: localStates[r.id] || r.review_status }} onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      {allDone.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#F5F1E8]/40 uppercase tracking-wider mb-3">Completed</h2>
          <div className="space-y-2">
            {allDone.map(r => (
              <InquiryCard key={r.id} row={{ ...r, review_status: localStates[r.id] || r.review_status }} onAction={handleAction} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
