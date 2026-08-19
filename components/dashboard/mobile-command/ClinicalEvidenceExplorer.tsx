'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { AskClinicalResponse } from '@/lib/clinical/prescriber'
import { countryIso2FromCommandHref } from './clinicalCommandContract'

/**
 * Legacy-compatible explicit-query explorer.
 *
 * The previous component auto-loaded a cross-jurisdiction evidence deck,
 * classified Safety from free text, and rendered a ranked answer before a
 * clinician submitted a question. Those behaviours are intentionally removed.
 * New Command Clinical uses the concise decision surface; this component remains
 * only as a safe explicit-query building block for any residual import.
 */
export default function ClinicalEvidenceExplorer({ commandHref }: { commandHref: string }) {
  const jurisdiction = useMemo(() => countryIso2FromCommandHref(commandHref), [commandHref])
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<AskClinicalResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery('')
    setAnswer(null)
    setLoading(false)
  }, [jurisdiction])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = query.trim()
    if (!jurisdiction || question.length < 2) return
    setAnswer(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: question, jurisdiction, limit: '8' })
      const response = await fetch(`/api/clinical/ask?${params}`, { cache: 'no-store' })
      setAnswer(await response.json() as AskClinicalResponse)
    } catch {
      setAnswer({
        state: 'error',
        question,
        answer: 'The governed evidence source is unavailable.',
        citations: [],
        unresolved: ['Retry before relying on this result.'],
      })
    } finally {
      setLoading(false)
    }
  }

  if (!jurisdiction) {
    return (
      <div className="hvm2-sourcing-note" data-sourcing="limited-coverage" role="status">
        <strong>Jurisdiction required</strong>
        <p>Clinical will not substitute another country for this query.</p>
      </div>
    )
  }

  return (
    <div className="hvm2-evidence-explorer">
      <form onSubmit={submit} className="hvm2-search-row" role="search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter a condition, formulation or clinical question"
          aria-label="Condition, formulation or clinical evidence question"
        />
        <button type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>
      <div aria-live="polite">
        {!answer && !loading && <p className="hvm2-muted">No answer is shown until an explicit clinical question is submitted.</p>}
        {answer && (
          <div className="hvm2-sourcing-note" data-sourcing={answer.state === 'loaded' ? 'loaded' : 'stale'} role="status">
            <strong>Governed evidence · {answer.state}</strong>
            <p>{answer.answer}</p>
            {answer.citations.map((citation) => (
              <a key={citation.evidenceRecordId} className="hvm2-text-link" href={citation.sourceUrl} target="_blank" rel="noreferrer">
                {citation.sourceTitle} · primary source ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
