'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { ClinicalEvidenceSearchResult } from '@/lib/clinical/evidence'
import { formatStatus } from './contracts'

/**
 * `jurisdiction` is the resolved country display name from the Command model
 * (e.g. "Germany"), not the ISO code in the URL. Evidence records store full
 * jurisdiction names, so an ISO code never matches — and defaulting an unknown
 * jurisdiction to "Canada" would label another country's workspace with
 * Canadian evidence. Both are treated as defects, see
 * docs/control/CLINICAL_FLAGSHIP_SPEC.md (Findings 2 and 3).
 */
export default function ClinicalEvidenceExplorer({ jurisdiction }: { jurisdiction: string }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceSearchResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ jurisdiction, limit: '20' })
    if (submittedQuery) params.set('q', submittedQuery)

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
  }, [jurisdiction, submittedQuery])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
  }

  const state = loading ? 'loading' : result?.state ?? 'error'

  return (
    <section className="hvm2-clinical-evidence" aria-labelledby="clinical-evidence-title">
      <style jsx global>{`
        @media (max-width: 559px) {
          #clinical .hvm2-section-heading {
            display: block;
          }
          #clinical .hvm2-section-heading > .hvm2-text-link {
            margin-top: 8px;
          }
          #clinical > .hvm2-sourcing-note {
            padding: 11px 13px;
          }
          #clinical > .hvm2-sourcing-note p {
            line-height: 1.45;
          }
          #clinical .hvm2-clinical-evidence {
            margin-top: 10px;
          }
          #clinical .hvm2-clinical-evidence > .hvm2-sourcing-note {
            padding: 12px 13px;
          }
          #clinical .hvm2-clinical-evidence form {
            margin-top: 10px;
          }
          #clinical .hvm2-clinical-evidence form > label {
            display: block;
            margin-bottom: 6px;
            font-size: 11px;
            font-weight: 700;
          }
          #clinical .hvm2-clinical-evidence .hvm2-two-column {
            grid-template-columns: 1fr;
          }
          #clinical .hvm2-clinical-evidence input,
          #clinical .hvm2-clinical-evidence button {
            min-height: 44px;
            width: 100%;
          }
        }
      `}</style>

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
            placeholder="e.g. Dravet syndrome"
            onChange={event => setQuery(event.target.value)}
          />
          <button type="submit" className="hvm2-inline-cta">Search reviewed evidence</button>
        </div>
      </form>

      {!loading && result?.synthesis && result.synthesis.recordCount > 0 && (
        <div className="hvm2-sourcing-note" data-sourcing={result.synthesis.hasMaterialConflict ? 'conflicted' : 'loaded'} aria-label="Evidence set summary">
          <strong>Evidence set · {result.synthesis.recordCount} published source{result.synthesis.recordCount === 1 ? '' : 's'}</strong>
          <p>
            {result.synthesis.gradedRecordCount} clinically graded · {result.synthesis.ungradedRecordCount} ungraded · {result.synthesis.regulatedDrugRecordCount} regulated-drug · {result.synthesis.generalCannabisRecordCount} general-cannabis.
          </p>
          <p>This is a provenance/count summary only; it does not infer efficacy or comparative superiority.</p>
        </div>
      )}

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
