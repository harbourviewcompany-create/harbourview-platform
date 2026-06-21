'use client'

import { useState } from 'react'

const MARKETS = [
  { iso2: 'DE', name: 'Germany' }, { iso2: 'GB', name: 'United Kingdom' },
  { iso2: 'AU', name: 'Australia' }, { iso2: 'CA', name: 'Canada' },
  { iso2: 'NL', name: 'Netherlands' }, { iso2: 'PT', name: 'Portugal' },
  { iso2: 'TH', name: 'Thailand' }, { iso2: 'IL', name: 'Israel' },
  { iso2: 'CO', name: 'Colombia' }, { iso2: 'ZA', name: 'South Africa' },
  { iso2: 'MT', name: 'Malta' }, { iso2: 'LU', name: 'Luxembourg' },
  { iso2: 'CZ', name: 'Czechia' }, { iso2: 'NZ', name: 'New Zealand' },
  { iso2: 'MX', name: 'Mexico' }, { iso2: 'BR', name: 'Brazil' },
  { iso2: 'CH', name: 'Switzerland' }, { iso2: 'FR', name: 'France' },
  { iso2: 'ES', name: 'Spain' }, { iso2: 'PL', name: 'Poland' },
]

type RunResult = { iso2: string; ok: boolean; signal_count?: number; error?: string }

export default function BriefingsSynthesisPage() {
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, RunResult>>({})
  const [allRunning, setAllRunning] = useState(false)
  const [allSummary, setAllSummary] = useState<{ succeeded: number; failed: number } | null>(null)

  async function synthesise(iso2: string) {
    setRunning(iso2)
    setResults(prev => ({ ...prev, [iso2]: { iso2, ok: false, error: undefined } }))
    try {
      const res = await fetch('/api/admin/intelligence/synthesize-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iso2 }),
      })
      const data = await res.json()
      setResults(prev => ({ ...prev, [iso2]: data }))
    } catch (e) {
      setResults(prev => ({ ...prev, [iso2]: { iso2, ok: false, error: String(e) } }))
    } finally {
      setRunning(null)
    }
  }

  async function synthesiseAll() {
    setAllRunning(true)
    setAllSummary(null)
    setResults({})
    try {
      const res = await fetch('/api/admin/intelligence/synthesize-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      const data = await res.json()
      if (data.results) {
        const mapped: Record<string, RunResult> = {}
        for (const r of data.results) mapped[r.iso2] = r
        setResults(mapped)
      }
      setAllSummary({ succeeded: data.succeeded ?? 0, failed: data.failed ?? 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setAllRunning(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Jurisdiction Briefings</h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', marginBottom: '28px' }}>
        Trigger AI-synthesised weekly briefings on demand. Each run queries the signals DB, calls Claude,
        and writes a published briefing row (upsert on country × week_ending).
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center' }}>
        <button
          onClick={synthesiseAll}
          disabled={allRunning || !!running}
          style={{
            padding: '10px 20px',
            background: allRunning ? 'rgba(212,168,75,.3)' : '#d4a84b',
            color: '#050c18',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            cursor: allRunning ? 'default' : 'pointer',
          }}
        >
          {allRunning ? 'Running all 20 markets…' : 'Synthesise All Markets'}
        </button>
        {allSummary && (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>
            Done: {allSummary.succeeded} ok, {allSummary.failed} failed
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {MARKETS.map(market => {
          const result = results[market.iso2]
          const isThis = running === market.iso2
          return (
            <div
              key={market.iso2}
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: result
                  ? `1px solid ${result.ok ? 'rgba(76,175,130,.3)' : 'rgba(224,85,85,.3)'}`
                  : '1px solid rgba(255,255,255,.08)',
                background: result
                  ? (result.ok ? 'rgba(76,175,130,.05)' : 'rgba(224,85,85,.05)')
                  : 'rgba(255,255,255,.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{market.name}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,.3)' }}>{market.iso2}</span>
              </div>
              {result && (
                <p style={{ fontSize: '11px', color: result.ok ? '#4caf82' : '#e05555', marginBottom: '8px' }}>
                  {result.ok
                    ? `✓ Published — ${result.signal_count ?? 0} signals`
                    : `✗ ${result.error ?? 'Failed'}`}
                </p>
              )}
              <button
                onClick={() => synthesise(market.iso2)}
                disabled={isThis || allRunning || !!running}
                style={{
                  padding: '6px 14px',
                  background: 'transparent',
                  border: '1px solid rgba(212,168,75,.3)',
                  color: '#d4a84b',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  cursor: isThis || allRunning || !!running ? 'default' : 'pointer',
                  opacity: !!running && !isThis ? 0.4 : 1,
                }}
              >
                {isThis ? 'Running…' : 'Synthesise'}
              </button>
            </div>
          )
        })}
      </div>

      <p style={{ marginTop: '32px', fontSize: '11px', color: 'rgba(255,255,255,.2)', lineHeight: 1.6 }}>
        Briefings are upserted on (country_iso2, week_ending) — re-running overwrites the current
        week&apos;s briefing. The weekly cron runs Monday 03:00 UTC automatically.
      </p>
    </div>
  )
}
