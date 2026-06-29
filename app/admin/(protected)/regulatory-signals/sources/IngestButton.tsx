'use client'

import { useState } from 'react'

interface IngestResult {
  ok: boolean
  changed?: boolean
  snapshot_id?: string | null
  response_time_ms?: number | null
  extract?: {
    signals_created?: number
    signals_extracted?: number
    reason?: string
  } | null
  error?: string
  stage?: string
}

export function IngestButton({ sourceId }: { sourceId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<IngestResult | null>(null)

  async function handleClick() {
    setState('loading')
    setResult(null)
    try {
      const res = await fetch('/api/admin/signals/trigger-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId }),
      })
      const data: IngestResult = await res.json()
      setResult(data)
      setState(data.ok ? 'done' : 'error')
    } catch (e) {
      setResult({ ok: false, error: String(e) })
      setState('error')
    }
  }

  const label =
    state === 'loading' ? 'Ingesting…'
    : state === 'done' ? (result?.changed ? `+${result.extract?.signals_created ?? 0} signals` : 'No change')
    : state === 'error' ? 'Failed'
    : 'Ingest Now'

  const colorClass =
    state === 'done' && result?.changed ? 'bg-emerald-700/80 text-white'
    : state === 'done' ? 'bg-white/10 text-[#F5F1E8]/60'
    : state === 'error' ? 'bg-red-800/60 text-red-200'
    : 'bg-[#C6A55A]/20 text-[#C6A55A] hover:bg-[#C6A55A]/30'

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${colorClass}`}
      >
        {label}
      </button>
      {state === 'error' && result?.error && (
        <p className="text-[10px] text-red-400 max-w-[160px] truncate" title={result.error}>
          {result.stage ? `[${result.stage}] ` : ''}{result.error}
        </p>
      )}
      {state === 'done' && result?.extract?.reason && (
        <p className="text-[10px] text-[#F5F1E8]/40 max-w-[160px] truncate" title={result.extract.reason}>
          {result.extract.reason}
        </p>
      )}
    </div>
  )
}
