'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { AdminSignalDTO, AdminSignalReviewSnapshot } from '@/lib/admin/signals/types'
import type { AdminSignalBatchAction, AdminSignalBatchResult, AdminSignalKind } from '@/lib/admin/signals/contract'

type ViewFilter = 'unreviewed' | 'urgent' | 'all'
type KindFilter = 'all' | AdminSignalKind

const priorityClass: Record<AdminSignalDTO['priority'], string> = {
  urgent: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  high: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  normal: 'border-white/10 bg-white/[0.025] text-[#F5F1E8]/60',
  low: 'border-white/8 bg-white/[0.015] text-[#F5F1E8]/42',
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown date'
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

function signalMatchesView(signal: AdminSignalDTO, view: ViewFilter) {
  if (view === 'urgent') return signal.priority === 'urgent' || signal.priority === 'high'
  if (view === 'unreviewed') return ['pending', 'draft', 'in_review'].includes(signal.reviewState)
  return true
}

function SignalCard({
  signal,
  active,
  selected,
  onOpen,
  onToggle,
}: {
  signal: AdminSignalDTO
  active: boolean
  selected: boolean
  onOpen: () => void
  onToggle: () => void
}) {
  return (
    <article className={`min-w-0 rounded-xl border p-3 transition ${active ? 'border-[#C6A55A]/45 bg-[#C6A55A]/7' : 'border-white/8 bg-white/[0.018] hover:bg-white/[0.03]'}`}>
      <div className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${signal.headline}`}
          className="mt-1 size-4 shrink-0 accent-[#C6A55A]"
        />
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] ${priorityClass[signal.priority]}`}>{signal.priority}</span>
            <span className="rounded-full border border-white/8 bg-black/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#F5F1E8]/42">{signal.kind}</span>
          </div>
          <h3 className="mt-2 break-words text-sm font-semibold leading-5 text-[#F5F1E8]">{signal.headline}</h3>
          <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-[#F5F1E8]/42">{signal.summary || 'No summary loaded.'}</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.08em] text-[#F5F1E8]/30">
            <span>{signal.jurisdiction || 'Unattributed'}</span>
            <span>{signal.sourceLabel || 'Unknown source'}</span>
            <span>{formatDate(signal.observedAt)}</span>
          </div>
        </button>
      </div>
    </article>
  )
}

function SignalDetail({
  signal,
  busy,
  onAction,
  onBack,
}: {
  signal: AdminSignalDTO
  busy: boolean
  onAction: (action: AdminSignalBatchAction, signal: AdminSignalDTO) => void
  onBack?: () => void
}) {
  return (
    <section className="min-w-0 rounded-xl border border-white/8 bg-[#091728]">
      <div className="border-b border-white/8 p-4">
        {onBack ? (
          <button type="button" onClick={onBack} className="mb-3 min-h-9 rounded-lg border border-white/10 px-3 text-xs text-[#F5F1E8]/62 xl:hidden">← Back to queue</button>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${priorityClass[signal.priority]}`}>{signal.priority}</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#F5F1E8]/45">{signal.kind}</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#F5F1E8]/45">{signal.reviewState.replace(/_/g, ' ')}</span>
        </div>
        <h2 className="mt-3 break-words text-xl font-semibold leading-7 text-[#F5F1E8]">{signal.headline}</h2>
        <p className="mt-2 text-xs text-[#F5F1E8]/40">{signal.jurisdiction || 'Unattributed'} · {signal.sourceLabel || 'Unknown source'} · {formatDate(signal.observedAt)}</p>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Review context</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#F5F1E8]/65">{signal.privateSummary || signal.summary || 'No review summary loaded.'}</p>
        </div>

        <dl className="grid gap-3 rounded-lg border border-white/8 bg-black/10 p-3 text-xs sm:grid-cols-2">
          <div><dt className="text-[#F5F1E8]/32">Lane / type</dt><dd className="mt-1 break-words text-[#F5F1E8]/65">{signal.lane || '—'}</dd></div>
          <div><dt className="text-[#F5F1E8]/32">Score / confidence</dt><dd className="mt-1 text-[#F5F1E8]/65">{signal.score ?? signal.confidence ?? '—'}</dd></div>
          <div><dt className="text-[#F5F1E8]/32">Public safe</dt><dd className="mt-1 text-[#F5F1E8]/65">{signal.publicSafe === null ? 'Not applicable' : signal.publicSafe ? 'Yes' : 'No'}</dd></div>
          <div><dt className="text-[#F5F1E8]/32">Public feed</dt><dd className="mt-1 text-[#F5F1E8]/65">{signal.publishToPublic === null ? 'Not applicable' : signal.publishToPublic ? 'Eligible' : 'Not eligible'}</dd></div>
        </dl>

        {signal.publicSummary || signal.publicImplication ? (
          <div className="rounded-lg border border-white/8 bg-white/[0.018] p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#F5F1E8]/32">Public-safe draft</p>
            {signal.publicSummary ? <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/62">{signal.publicSummary}</p> : null}
            {signal.publicImplication ? <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/45">Implication: {signal.publicImplication}</p> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-white/8 pt-4">
          {signal.allowedActions.includes('approve') ? (
            <button disabled={busy} type="button" onClick={() => onAction('approve', signal)} className="min-h-10 rounded-lg bg-emerald-400/15 px-4 text-sm font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/25 disabled:opacity-45">Approve</button>
          ) : null}
          {signal.allowedActions.includes('reject') ? (
            <button disabled={busy} type="button" onClick={() => onAction('reject', signal)} className="min-h-10 rounded-lg bg-rose-400/10 px-4 text-sm font-medium text-rose-200 ring-1 ring-inset ring-rose-400/25 disabled:opacity-45">Reject</button>
          ) : null}
          {signal.allowedActions.includes('open_curated_review') ? (
            <Link href="/admin/signals/review" className="inline-flex min-h-10 items-center rounded-lg border border-[#C6A55A]/30 px-4 text-sm text-[#E2C776]">Open curated review</Link>
          ) : null}
          {signal.sourceUrl ? (
            <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm text-[#F5F1E8]/55">View source ↗</a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default function SignalReviewWorkspace({
  snapshot,
  initialSelectedKey,
}: {
  snapshot: AdminSignalReviewSnapshot
  initialSelectedKey?: string
}) {
  const [signals, setSignals] = useState(snapshot.signals)
  const [view, setView] = useState<ViewFilter>('unreviewed')
  const [kind, setKind] = useState<KindFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(
    initialSelectedKey && snapshot.signals.some((signal) => signal.key === initialSelectedKey)
      ? initialSelectedKey
      : snapshot.signals[0]?.key || null,
  )
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(Boolean(initialSelectedKey))

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return signals.filter((signal) => {
      if (kind !== 'all' && signal.kind !== kind) return false
      if (!signalMatchesView(signal, view)) return false
      if (!needle) return true
      return [signal.headline, signal.summary, signal.jurisdiction, signal.sourceLabel, signal.lane]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [signals, kind, query, view])

  const selectedSignal = signals.find((signal) => signal.key === selectedSignalKey) || filtered[0] || null
  const selectedRows = signals.filter((signal) => checked.has(signal.key))
  const canBulkApprove = selectedRows.length > 0 && selectedRows.every((signal) => signal.kind === 'engine' && signal.allowedActions.includes('approve'))

  function toggleChecked(key: string) {
    setChecked((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function openSignal(key: string) {
    setSelectedSignalKey(key)
    setMobileDetailOpen(true)
  }

  async function executeBatch(action: AdminSignalBatchAction, targets: AdminSignalDTO[]) {
    if (!targets.length) return
    setBusy(true)
    setResultMessage(null)
    const groups = new Map<AdminSignalKind, AdminSignalDTO[]>()
    for (const target of targets) groups.set(target.kind, [...(groups.get(target.kind) || []), target])

    const aggregate: AdminSignalBatchResult[] = []
    for (const [groupKind, rows] of groups) {
      const response = await fetch('/api/admin/signals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: groupKind,
          action,
          ids: rows.map((row) => row.id),
          dryRun: false,
          idempotencyKey: `${groupKind}:${action}:${crypto.randomUUID()}`,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body) {
        aggregate.push({
          kind: groupKind,
          action,
          dryRun: false,
          idempotencyKey: 'request-failed',
          requested: rows.length,
          succeeded: 0,
          failed: rows.length,
          skipped: 0,
          results: rows.map((row) => ({ id: row.id, ok: false, errorCode: 'request_failed', message: body?.error || `HTTP ${response.status}` })),
        })
      } else {
        aggregate.push(body as AdminSignalBatchResult)
      }
    }

    const successful = new Map<string, string>()
    for (const result of aggregate) {
      for (const item of result.results) if (item.ok && item.resultingState) successful.set(`${result.kind}:${item.id}`, item.resultingState)
    }
    if (successful.size) {
      setSignals((previous) => previous.map((signal) => successful.has(signal.key) ? { ...signal, reviewState: successful.get(signal.key)! } : signal))
      setChecked((previous) => {
        const next = new Set(previous)
        for (const key of successful.keys()) next.delete(key)
        return next
      })
    }
    const succeeded = aggregate.reduce((sum, result) => sum + result.succeeded, 0)
    const failed = aggregate.reduce((sum, result) => sum + result.failed, 0)
    const skipped = aggregate.reduce((sum, result) => sum + result.skipped, 0)
    setResultMessage(`${action}: ${succeeded} succeeded${failed ? `, ${failed} failed` : ''}${skipped ? `, ${skipped} skipped` : ''}.`)
    setBusy(false)
  }

  return (
    <section className="min-w-0 space-y-4">
      <header className="flex min-w-0 flex-col gap-4 border-b border-white/8 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C6A55A]">Governed review</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Signal Review</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/55">
            One review workspace over two preserved lifecycles: automated engine signals and curated regulatory signals. Regulatory publication remains gated by its existing public-safety workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link className="rounded-lg border border-white/10 px-3 py-2 text-[#F5F1E8]/60" href="/admin/signals/sources">Regulatory sources</Link>
          <Link className="rounded-lg border border-white/10 px-3 py-2 text-[#F5F1E8]/60" href="/admin/signals/analysis">Analysis</Link>
          <Link className="rounded-lg border border-white/10 px-3 py-2 text-[#F5F1E8]/60" href="/admin/signals/queue">Legacy engine queue</Link>
        </div>
      </header>

      {snapshot.sources.some((source) => source.state === 'degraded') ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
          Partial signal data: {snapshot.sources.filter((source) => source.state === 'degraded').map((source) => source.kind).join(', ')} unavailable. Loaded lifecycle data remains usable.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[220px_minmax(320px,.9fr)_minmax(380px,1.1fr)]">
        <aside className="min-w-0 rounded-xl border border-white/8 bg-[#091728] p-3 xl:sticky xl:top-20 xl:self-start">
          <p className="px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#F5F1E8]/34">Views</p>
          <div className="mt-2 grid grid-cols-3 gap-1 xl:grid-cols-1">
            {(['unreviewed', 'urgent', 'all'] as ViewFilter[]).map((value) => (
              <button key={value} onClick={() => setView(value)} type="button" className={`min-h-10 rounded-lg px-3 text-left text-xs capitalize ${view === value ? 'bg-[#C6A55A]/12 text-[#E2C776]' : 'text-[#F5F1E8]/52 hover:bg-white/[0.04]'}`}>{value}</button>
            ))}
          </div>
          <p className="mt-4 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#F5F1E8]/34">Lifecycle</p>
          <div className="mt-2 grid grid-cols-3 gap-1 xl:grid-cols-1">
            {(['all', 'engine', 'regulatory'] as KindFilter[]).map((value) => (
              <button key={value} onClick={() => setKind(value)} type="button" className={`min-h-10 rounded-lg px-3 text-left text-xs capitalize ${kind === value ? 'bg-white/[0.06] text-[#F5F1E8]' : 'text-[#F5F1E8]/52 hover:bg-white/[0.04]'}`}>{value}</button>
            ))}
          </div>
          <div className="mt-4 border-t border-white/8 pt-3 text-xs text-[#F5F1E8]/38">
            <div className="flex justify-between"><span>Engine</span><span>{snapshot.sources.find((source) => source.kind === 'engine')?.count ?? '—'}</span></div>
            <div className="mt-2 flex justify-between"><span>Regulatory</span><span>{snapshot.sources.find((source) => source.kind === 'regulatory')?.count ?? '—'}</span></div>
          </div>
        </aside>

        <section className={`min-w-0 ${mobileDetailOpen ? 'hidden xl:block' : ''}`}>
          <div className="rounded-xl border border-white/8 bg-[#091728] p-3">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter loaded signals…" className="min-h-10 w-full rounded-lg border border-white/10 bg-[#06101E] px-3 text-sm text-[#F5F1E8] placeholder:text-[#F5F1E8]/25" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#F5F1E8]/38">
              <span>{filtered.length} loaded</span>
              <button type="button" onClick={() => setChecked(new Set(filtered.map((signal) => signal.key)))} className="min-h-9 rounded-lg border border-white/10 px-3 text-[#F5F1E8]/55">Select visible</button>
            </div>
          </div>

          {checked.size ? (
            <div className="sticky top-16 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#C6A55A]/25 bg-[#071423]/95 p-3 shadow-lg backdrop-blur">
              <span className="mr-auto text-xs text-[#F5F1E8]/55">{checked.size} selected</span>
              <button disabled={busy || !canBulkApprove} type="button" onClick={() => executeBatch('approve', selectedRows)} className="min-h-9 rounded-lg bg-emerald-400/15 px-3 text-xs font-medium text-emerald-200 disabled:opacity-35">Approve</button>
              <button disabled={busy} type="button" onClick={() => executeBatch('reject', selectedRows)} className="min-h-9 rounded-lg bg-rose-400/10 px-3 text-xs font-medium text-rose-200 disabled:opacity-35">Reject</button>
              <button disabled={busy} type="button" onClick={() => setChecked(new Set())} className="min-h-9 rounded-lg border border-white/10 px-3 text-xs text-[#F5F1E8]/55">Clear</button>
            </div>
          ) : null}

          {resultMessage ? <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-[#F5F1E8]/60">{resultMessage}</div> : null}

          <div className="mt-3 space-y-2">
            {filtered.length ? filtered.map((signal) => (
              <SignalCard
                key={signal.key}
                signal={signal}
                active={selectedSignal?.key === signal.key}
                selected={checked.has(signal.key)}
                onToggle={() => toggleChecked(signal.key)}
                onOpen={() => openSignal(signal.key)}
              />
            )) : (
              <div className="rounded-xl border border-white/8 bg-white/[0.018] px-4 py-10 text-center text-sm text-[#F5F1E8]/38">No loaded signals match this view.</div>
            )}
          </div>
        </section>

        <div className={`min-w-0 ${mobileDetailOpen ? 'block' : 'hidden xl:block'}`}>
          {selectedSignal ? (
            <SignalDetail
              signal={selectedSignal}
              busy={busy}
              onAction={(action, signal) => executeBatch(action, [signal])}
              onBack={() => setMobileDetailOpen(false)}
            />
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/[0.018] px-4 py-12 text-center text-sm text-[#F5F1E8]/38">Select a signal to review.</div>
          )}
        </div>
      </div>
    </section>
  )
}
