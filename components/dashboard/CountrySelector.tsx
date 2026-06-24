'use client'

import { useState, useEffect, useRef } from 'react'
import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { useAllCountries, CountryRow } from '@/hooks/useAllCountries'
import { StatusBadge } from './StatusBadge'

interface Props {
  open: boolean
  onClose: () => void
}

export function CountrySelector({ open, onClose }: Props) {
  const { setCountry, countryIso2 } = useDashboard()
  const countries = useAllCountries()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 60) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const rows: CountryRow[] = countries.status === 'ok' ? countries.data : []
  const filtered = query
    ? rows.filter(c => c.country_name.toLowerCase().includes(query.toLowerCase()))
    : rows

  function select(c: CountryRow) {
    setCountry(c.iso_alpha2, c.country_name)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex w-full max-w-[520px] max-h-[540px] flex-col overflow-hidden rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        {/* Head */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="font-serif text-base" style={{ color: 'var(--hv-text-primary, #F3F0EA)' }}>
            Select your market
          </span>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-opacity hover:opacity-70"
            style={{ color: 'rgba(243,240,234,0.4)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search countries…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg bg-white/[0.05] px-3 py-2 text-sm outline-none placeholder:opacity-40"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--hv-text-primary)',
            }}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {countries.status === 'loading' && (
            <p className="p-4 text-center text-xs" style={{ color: 'rgba(198,165,90,0.5)' }}>
              Loading markets…
            </p>
          )}
          {filtered.map(c => (
            <button
              key={c.iso_alpha2}
              onClick={() => select(c)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
              style={c.iso_alpha2 === countryIso2 ? { background: 'rgba(198,165,90,0.1)' } : {}}
            >
              <span className="flex-1 text-sm" style={{ color: 'var(--hv-text-primary)' }}>
                {c.country_name}
              </span>
              {c.market_access_status && (
                <StatusBadge label={c.market_access_status} />
              )}
            </button>
          ))}
          {filtered.length === 0 && countries.status === 'ok' && (
            <p className="p-4 text-center text-xs" style={{ color: 'rgba(243,240,234,0.35)' }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
