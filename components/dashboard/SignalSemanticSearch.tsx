'use client'

// components/dashboard/SignalSemanticSearch.tsx
// Self-contained search box + results list for POST /api/signals/search.
//
// Deliberately built as its own standalone component rather than injected
// into MobileCommandCentre.tsx (4,800+ lines, an unscoped global <style>
// string per docs/control/AGENT_PREFLIGHT_CHECKLIST.md) -- keeps this
// additive and independently reversible: delete this file and its page,
// nothing else changes.

import { useState, useCallback } from 'react'
import type { SignalSearchResult } from '@/app/api/signals/search/route'

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string; upgrade?: boolean }
  | { status: 'done'; results: SignalSearchResult[]; mode: 'semantic' | 'keyword' }

const CONFIDENCE_LABEL: Record<string, string> = {
  verified: 'Verified',
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

const IMPACT_LABEL: Record<string, string> = {
  critical: 'Critical impact',
  high: 'High impact',
  moderate: 'Moderate impact',
  low: 'Low impact',
}

export default function SignalSemanticSearch() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>({ status: 'idle' })

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) return
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/signals/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      const body = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: body.error ?? `Search failed (${res.status})`, upgrade: body.upgrade })
        return
      }
      setState({ status: 'done', results: body.results ?? [], mode: body.mode ?? 'keyword' })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Search failed' })
    }
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void runSearch(query)
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search regulatory signals, e.g. 'import licensing Germany'"
          aria-label="Search signals"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111',
            color: '#eee',
            fontSize: 15,
          }}
        />
        <button
          type="submit"
          disabled={state.status === 'loading' || query.trim().length < 2}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#c9a24b',
            color: '#111',
            fontWeight: 600,
            cursor: state.status === 'loading' ? 'wait' : 'pointer',
          }}
        >
          {state.status === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>

      {state.status === 'error' && (
        <p style={{ marginTop: 16, color: '#e08080' }}>
          {state.message}
          {state.upgrade && ' — signal search requires an Intel or Operator plan.'}
        </p>
      )}

      {state.status === 'done' && (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
            {state.results.length} result{state.results.length === 1 ? '' : 's'}
            {state.mode === 'keyword' && ' (keyword match — semantic search found nothing closer)'}
          </p>
          {state.results.map((r) => (
            <article
              key={r.id}
              style={{
                padding: '14px 16px',
                marginBottom: 10,
                borderRadius: 10,
                border: '1px solid #2a2a2a',
                background: '#161616',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, color: '#f0f0f0' }}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    {r.headline}
                  </a>
                ) : (
                  r.headline
                )}
              </h3>
              <p style={{ margin: '6px 0', color: '#aaa', fontSize: 14 }}>{r.summary}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#888' }}>
                {r.country && <span>{r.country}</span>}
                {r.confidence && <span>{CONFIDENCE_LABEL[r.confidence] ?? r.confidence}</span>}
                {r.impact_level && <span>{IMPACT_LABEL[r.impact_level] ?? r.impact_level}</span>}
                {r.translated && r.original_language_label && <span>Translated from {r.original_language_label}</span>}
                {typeof r.similarity === 'number' && <span>{Math.round(r.similarity * 100)}% match</span>}
              </div>
            </article>
          ))}
          {state.results.length === 0 && <p style={{ color: '#888' }}>No signals matched that search.</p>}
        </div>
      )}
    </div>
  )
}
