'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { ClinicalEvidenceSearchResult } from '@/lib/clinical/evidence'
import { formatStatus } from './contracts'

function jurisdictionFromCommandHref(commandHref: string): string {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  const raw = new URLSearchParams(query).get('country')?.trim() ?? ''
  if (raw.toUpperCase() === 'CA') return 'Canada'
  return raw || 'Canada'
}

export default function ClinicalEvidenceExplorer({
  commandHref,
  profession,
}: {
  commandHref: string
  profession: string
}) {
  const jurisdiction = useMemo(() => jurisdictionFromCommandHref(commandHref), [commandHref])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceSearchResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ jurisdiction, limit: '20' })
    if (submittedQuery) params.set('q', submittedQuery)
    if (profession && profession.toLowerCase() !== 'all roles') params.set('profession', profession)

    setLoading(true)
    fetch(`/api/clinical/evidence?${params}`, { signal: controller.signal, credentials: 'same-origin' })
      .then(async response => {
        const body = await response.json() as ClinicalEvidenceSearchResult
        setResult(body)
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResult({
          state: 'error', query: submittedQuery, records: [], changes: [],
          message: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
        })
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [jurisdiction, profession, submittedQuery])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
  }

  const state = loading ? 'loading' : result?.state ?? 'error'

  return (
    <section aria-labelledby="clinical-evidence-title">
      <div className="hvm2-sourcing-note" data-sourcing={state} aria-live="polite">
        <strong id="clinical-evidence-title">Evidence by condition · {jurisdiction}</strong>
        <p>{loading ? 'Loading reviewed evidence…' : result?.message}</p>
      </div>

      <form onSubmit={submit} role="search" aria-label="Search clinical evidence by condition">
        <label htmlFor="clinical-evidence-query">Condition or clinical question</label>
        <div className="hvm2-two-column">
          <input
            id="clinical-evidence-query"
            type="search"
            value={query}
            maxLength={160}
            autoComplete="off"
            placeholder="e.g. neuropathic pain"
            onChange={event => setQuery(event.target.value)}
          />
          <button type="submit" className="hvm2-inline-cta">Search reviewed evidence</button>
        </div>
      </form>

      {!loading && result && result.changes.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Clinical evidence changes">
          {result.changes.slice(0, 3).map(change => (
            <article className="hvm2-directory-card" key={change.id}>
              <span>What changed · {formatStatus(change.materiality)}</span>
              <h3>{change.title}</h3>
              <p>{change.summary}</p>
              <p>Verified {change.verifiedAt.slice(0, 10)} · {change.primarySource.publisher}</p>
              <a className="hvm2-text-link" href={change.primarySource.url} target="_blank" rel="noreferrer">Primary source ↗</a>
            </article>
          ))}
        </div>
      )}

      {!loading && result && result.records.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Clinical evidence results">
          {result.records.map(record => (
            <article className="hvm2-directory-card" key={record.id}>
              <span>{record.condition || 'Regulatory / professional evidence'}</span>
              <h3>{record.title}</h3>
              <p>{record.summary}</p>
              <p><strong>{formatStatus(record.evidenceType)}</strong> · certainty {formatStatus(record.evidenceStrength)}</p>
              <p>{formatStatus(record.interventionClass)}{record.cannabinoid.length ? ` · ${record.cannabinoid.join(', ')}` : ''}</p>
              {record.uncertainty && <p>Uncertainty: {record.uncertainty}</p>}
              <p>Verified {record.verifiedAt.slice(0, 10)} · {record.primarySource.publisher}</p>
              <a className="hvm2-text-link" href={record.primarySource.url} target="_blank" rel="noreferrer">Primary source ↗</a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
