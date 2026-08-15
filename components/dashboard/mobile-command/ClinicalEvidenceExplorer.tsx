'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'
import {
  clinicalFailureLabel,
  clinicalStateLabel,
  isClinicalEvidenceApiResult,
  type ClinicalEvidenceApiResult,
} from '@/lib/clinical/runtime'
import { CANADA_CLINICAL_AUTHORITIES } from './clinicalCommandContract'
import { formatStatus } from './contracts'

type ClinicalView = 'evidence' | 'safety' | 'interactions' | 'formulations' | 'guidelines' | 'practice' | 'monitoring'

function commandParams(commandHref: string): URLSearchParams {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  return new URLSearchParams(query)
}

function jurisdictionFromCommandHref(commandHref: string): string {
  const raw = commandParams(commandHref).get('country')?.trim() ?? ''
  if (raw.toUpperCase() === 'CA') return 'Canada'
  return raw || 'Canada'
}

function roleFromCommandHref(commandHref: string): string {
  const raw = commandParams(commandHref).get('role')?.trim() ?? ''
  return raw ? formatStatus(raw) : 'All roles'
}

function date(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : 'Not recorded'
}

function recordIsSafety(record: ClinicalEvidenceRecordDTO): boolean {
  const searchable = [record.title, record.summary, record.outcome, record.uncertainty]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
  return record.evidenceType === 'pharmacovigilance-signal'
    || /safety|adverse|contraindicat|interaction|tolerab/.test(searchable)
}

function recordsForView(records: ClinicalEvidenceRecordDTO[], view: ClinicalView): ClinicalEvidenceRecordDTO[] {
  if (view === 'safety') return records.filter(recordIsSafety)
  if (view === 'formulations') {
    return records.filter(record =>
      record.interventionClass === 'regulated-cannabinoid-drug'
      || record.interventionClass === 'cannabinoid-isolate'
      || record.interventionClass === 'cannabis-derived-formulation'
      || Boolean(record.formulation)
      || record.cannabinoid.length > 0,
    )
  }
  if (view === 'guidelines') return records.filter(record => record.evidenceType === 'clinical-guideline')
  if (view === 'practice') return records.filter(record => record.evidenceType === 'regulation' || record.evidenceType === 'regulatory-guidance')
  if (view === 'interactions' || view === 'monitoring') return []
  return records
}

function stateAttention(result: ClinicalEvidenceApiResult | null, loading: boolean): { title: string; detail: string } {
  if (loading) return { title: 'Checking evidence state', detail: 'Loading reviewed records, currentness and conflict status.' }
  if (!result) return { title: 'Evidence state unavailable', detail: 'Retry the evidence service before relying on this workspace.' }
  if (result.state === 'conflicted') return { title: 'Material conflict requires review', detail: 'Open the conflicting records and primary sources before relying on a conclusion.' }
  if (result.state === 'stale') return { title: 'Currentness requires review', detail: 'Only stale, superseded or review-required records match the current question.' }
  if (result.state === 'degraded-source') return { title: 'Partial source coverage', detail: 'At least one source has degraded or unresolved currentness. Verify the primary source.' }
  if (result.state === 'permission') return { title: 'Evidence access restricted', detail: result.message }
  if (result.state === 'error') {
    const label = result.diagnostic ? clinicalFailureLabel(result.diagnostic.category) : 'Evidence service unavailable'
    return { title: label, detail: result.message }
  }
  if (result.state === 'no-evidence') return { title: 'Known condition, no reviewed record', detail: 'The condition is recognized but the governed corpus has no published evidence record for this context.' }
  if (result.state === 'no-match') return { title: 'No reviewed match', detail: 'Change the question or clear the search; no matching condition or evidence record is published.' }

  const ungraded = result.synthesis?.ungradedRecordCount ?? result.records.filter(record => record.evidenceStrength === 'ungraded').length
  return ungraded > 0
    ? { title: 'Inspect certainty and applicability', detail: `${ungraded} loaded record${ungraded === 1 ? ' is' : 's are'} ungraded; source authority is not the same as clinical efficacy certainty.` }
    : { title: 'Inspect applicability', detail: 'Confirm population, formulation, jurisdiction, professional scope and source date before relying on a record.' }
}

function evidenceClassLabel(record: ClinicalEvidenceRecordDTO): string {
  if (record.interventionClass === 'regulated-cannabinoid-drug') return 'Regulated cannabinoid drug'
  if (record.interventionClass === 'general-cannabis') return 'General cannabis / authority'
  return formatStatus(record.interventionClass)
}

export default function ClinicalEvidenceExplorer({ commandHref }: { commandHref: string }) {
  const jurisdiction = useMemo(() => jurisdictionFromCommandHref(commandHref), [commandHref])
  const role = useMemo(() => roleFromCommandHref(commandHref), [commandHref])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceApiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)
  const [activeView, setActiveView] = useState<ClinicalView>('evidence')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const params = new URLSearchParams({ jurisdiction, limit: '50' })
    if (submittedQuery) params.set('q', submittedQuery)

    setLoading(true)
    fetch(`/api/clinical/evidence?${params}`, { signal: controller.signal, credentials: 'same-origin' })
      .then(async response => {
        const body: unknown = await response.json().catch(() => null)
        if (!isClinicalEvidenceApiResult(body)) {
          throw new Error(response.ok ? 'clinical_evidence_schema_contract_validation' : `clinical_evidence_http_${response.status}`)
        }
        if (active) setResult(body)
      })
      .catch(error => {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return
        setResult({
          state: 'error',
          query: submittedQuery,
          records: [],
          changes: [],
          message: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
          diagnostic: {
            category: error instanceof Error && /schema|contract/i.test(error.message) ? 'schema' : 'upstream',
            retryable: true,
            httpStatus: null,
          },
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [jurisdiction, submittedQuery, requestVersion])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveView('evidence')
    setSubmittedQuery(query.trim())
  }

  function clearSearch() {
    setQuery('')
    setSubmittedQuery('')
    setActiveView('evidence')
  }

  const state = loading ? 'loading' : result?.state ?? 'error'
  const attention = stateAttention(result, loading)
  const latestChange = result?.changes[0] ?? null
  const visibleRecords = recordsForView(result?.records ?? [], activeView)
  const safetyAuthority = CANADA_CLINICAL_AUTHORITIES.find(source => source.id === 'safety-interactions')
  const documentAuthority = CANADA_CLINICAL_AUTHORITIES.find(source => source.id === 'medical-document')
  const pharmacovigilanceAuthority = CANADA_CLINICAL_AUTHORITIES.find(source => source.id === 'pharmacovigilance')

  const viewLabels: Record<ClinicalView, string> = {
    evidence: 'Evidence',
    safety: 'Safety',
    interactions: 'Interactions',
    formulations: 'Formulations',
    guidelines: 'Guidelines',
    practice: 'Practice',
    monitoring: 'Monitoring',
  }

  return (
    <section className="hvm2-clinical-evidence hvc-command" aria-labelledby="clinical-evidence-title">
      <style jsx global>{`
        #clinical.hvm2-section {
          padding-bottom: max(116px, calc(96px + env(safe-area-inset-bottom)));
        }
        #clinical > .hvm2-section-heading {
          gap: 8px;
          margin-bottom: 10px;
        }
        #clinical > .hvm2-section-heading h2 {
          margin: 3px 0 4px;
          font-size: clamp(1.75rem, 6.8vw, 2.35rem);
          line-height: 1.02;
        }
        #clinical > .hvm2-section-heading p {
          max-width: 58rem;
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.42;
        }
        #clinical > .hvm2-section-heading > .hvm2-text-link {
          align-self: end;
          white-space: nowrap;
        }
        #clinical > .hvm2-compliance-grid {
          display: none;
        }
        #clinical > .hvm2-sourcing-note {
          margin-top: 12px;
          padding: 11px 13px;
        }
        #clinical .hvc-command {
          display: grid;
          gap: 12px;
          margin-top: 4px;
        }
        #clinical .hvc-statusbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 38px;
          padding: 8px 10px;
          border: 1px solid rgba(214, 178, 92, 0.18);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
        }
        #clinical .hvc-statusbar strong {
          font-size: 0.78rem;
        }
        #clinical .hvc-state {
          flex: 0 0 auto;
          padding: 4px 8px;
          border: 1px solid rgba(214, 178, 92, 0.28);
          border-radius: 999px;
          color: #e7c875;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        #clinical .hvc-now-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        #clinical .hvc-now-card {
          min-width: 0;
          padding: 11px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
        }
        #clinical .hvc-now-card > span,
        #clinical .hvc-block-label {
          display: block;
          margin-bottom: 4px;
          color: #d9b85d;
          font-size: 0.67rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        #clinical .hvc-now-card strong {
          display: block;
          font-size: 0.88rem;
          line-height: 1.25;
        }
        #clinical .hvc-now-card p {
          margin: 5px 0 0;
          color: rgba(236, 236, 236, 0.72);
          font-size: 0.74rem;
          line-height: 1.38;
        }
        #clinical .hvc-ask {
          padding: 12px;
          border: 1px solid rgba(214, 178, 92, 0.24);
          border-radius: 15px;
          background: rgba(7, 17, 31, 0.72);
        }
        #clinical .hvc-ask h3 {
          margin: 0;
          font-size: 1rem;
        }
        #clinical .hvc-ask > p {
          margin: 4px 0 10px;
          color: rgba(236, 236, 236, 0.66);
          font-size: 0.76rem;
          line-height: 1.4;
        }
        #clinical .hvc-search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
        }
        #clinical .hvc-search-row input {
          width: 100%;
          min-width: 0;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 11px;
          background: rgba(0, 0, 0, 0.22);
          color: inherit;
        }
        #clinical .hvc-search-row button,
        #clinical .hvc-retry,
        #clinical .hvc-lane {
          min-height: 44px;
          border: 1px solid rgba(214, 178, 92, 0.28);
          border-radius: 11px;
          background: rgba(214, 178, 92, 0.07);
          color: #e7c875;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 800;
        }
        #clinical .hvc-search-scope {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 8px;
          color: rgba(236, 236, 236, 0.6);
          font-size: 0.7rem;
        }
        #clinical .hvc-search-scope button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #e7c875;
          font: inherit;
          font-weight: 800;
        }
        #clinical .hvc-state-panel {
          padding: 11px 12px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.02);
        }
        #clinical .hvc-state-panel[data-state="error"],
        #clinical .hvc-state-panel[data-state="permission"],
        #clinical .hvc-state-panel[data-state="stale"],
        #clinical .hvc-state-panel[data-state="conflicted"],
        #clinical .hvc-state-panel[data-state="degraded-source"] {
          border-color: rgba(214, 178, 92, 0.34);
        }
        #clinical .hvc-state-panel strong {
          display: block;
          font-size: 0.84rem;
        }
        #clinical .hvc-state-panel p {
          margin: 4px 0 0;
          color: rgba(236, 236, 236, 0.68);
          font-size: 0.74rem;
          line-height: 1.4;
        }
        #clinical .hvc-retry {
          width: auto;
          min-height: 36px;
          margin-top: 8px;
          padding: 0 12px;
        }
        #clinical .hvc-lanes {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }
        #clinical .hvc-lane {
          min-height: 38px;
          padding: 6px 4px;
          border-color: rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.025);
          color: rgba(236, 236, 236, 0.72);
          font-size: 0.68rem;
        }
        #clinical .hvc-lane[data-active="true"] {
          border-color: rgba(214, 178, 92, 0.38);
          background: rgba(214, 178, 92, 0.09);
          color: #e7c875;
        }
        #clinical .hvc-results {
          display: grid;
          gap: 8px;
        }
        #clinical .hvc-results-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 8px;
        }
        #clinical .hvc-results-head h3 {
          margin: 0;
          font-size: 1rem;
        }
        #clinical .hvc-results-head span {
          color: rgba(236, 236, 236, 0.5);
          font-size: 0.7rem;
        }
        #clinical .hvc-record {
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.02);
        }
        #clinical .hvc-record summary {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          padding: 11px 12px;
          cursor: pointer;
          list-style: none;
        }
        #clinical .hvc-record summary::-webkit-details-marker { display: none; }
        #clinical .hvc-record summary small,
        #clinical .hvc-record summary strong {
          display: block;
        }
        #clinical .hvc-record summary small {
          margin-bottom: 3px;
          color: #d9b85d;
          font-size: 0.66rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        #clinical .hvc-record summary strong {
          font-size: 0.86rem;
          line-height: 1.25;
        }
        #clinical .hvc-record-state {
          align-self: start;
          padding: 3px 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          color: rgba(236, 236, 236, 0.58);
          font-size: 0.62rem;
          white-space: nowrap;
        }
        #clinical .hvc-record-body {
          display: grid;
          gap: 8px;
          padding: 0 12px 12px;
          color: rgba(236, 236, 236, 0.74);
          font-size: 0.75rem;
          line-height: 1.42;
        }
        #clinical .hvc-record-body p { margin: 0; }
        #clinical .hvc-facts {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 4px 9px;
          margin: 0;
        }
        #clinical .hvc-facts dt {
          color: rgba(236, 236, 236, 0.45);
        }
        #clinical .hvc-facts dd {
          min-width: 0;
          margin: 0;
        }
        #clinical .hvc-boundary {
          padding: 12px;
          border: 1px dashed rgba(214, 178, 92, 0.24);
          border-radius: 13px;
        }
        #clinical .hvc-boundary strong { display: block; font-size: 0.83rem; }
        #clinical .hvc-boundary p { margin: 5px 0 0; color: rgba(236, 236, 236, 0.66); font-size: 0.74rem; line-height: 1.42; }
        #clinical .hvc-boundary a { display: inline-block; margin-top: 7px; }
        #clinical > .hvm2-horizontal-deck,
        #clinical > .hvm2-two-column {
          margin-top: 12px;
        }

        @media (max-width: 559px) {
          #clinical > .hvm2-section-heading {
            display: block;
          }
          #clinical > .hvm2-section-heading > .hvm2-text-link {
            display: inline-block;
            margin-top: 6px;
            font-size: 0.78rem;
          }
          #clinical .hvc-search-row {
            grid-template-columns: 1fr;
          }
          #clinical .hvc-lanes {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          #clinical .hvc-lane {
            min-height: 36px;
          }
        }

        @media (max-width: 374px) {
          #clinical .hvc-now-grid { grid-template-columns: 1fr; }
          #clinical .hvc-lanes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>

      <div className="hvc-statusbar" aria-live="polite">
        <strong id="clinical-evidence-title">Evidence command · {jurisdiction} · {role}</strong>
        <span className="hvc-state">{clinicalStateLabel(state)}</span>
      </div>

      <div className="hvc-now-grid" aria-label="Clinical command now">
        <article className="hvc-now-card">
          <span>What changed</span>
          <strong>{loading ? 'Checking current changes' : latestChange?.title ?? 'No published change event loaded'}</strong>
          <p>{loading ? 'Comparing the loaded clinical evidence context.' : latestChange ? `${latestChange.summary} Verified ${date(latestChange.verifiedAt)}.` : 'No reviewed material-change record is available for this context; this is not a claim that nothing changed externally.'}</p>
        </article>
        <article className="hvc-now-card">
          <span>What needs attention</span>
          <strong>{attention.title}</strong>
          <p>{attention.detail}</p>
        </article>
      </div>

      <form className="hvc-ask" onSubmit={submit} role="search" aria-label="Ask Clinical reviewed evidence search">
        <span className="hvc-block-label">Ask Clinical</span>
        <h3>Search the governed evidence corpus</h3>
        <p>Condition, formulation, cannabinoid or clinical evidence question. Results are deterministic reviewed records, not patient-specific advice.</p>
        <div className="hvc-search-row">
          <input
            id="clinical-evidence-query"
            aria-label="Condition, formulation or clinical evidence question"
            type="search"
            value={query}
            maxLength={160}
            autoComplete="off"
            placeholder="e.g. Dravet syndrome, cannabidiol, adverse reaction"
            onChange={event => setQuery(event.target.value)}
          />
          <button type="submit">Search evidence</button>
        </div>
        {submittedQuery && (
          <div className="hvc-search-scope">
            <span>Current question: “{submittedQuery}”</span>
            <button type="button" onClick={clearSearch}>Clear</button>
          </div>
        )}
      </form>

      {!loading && result && ['error', 'permission', 'no-match', 'no-evidence', 'stale', 'conflicted', 'degraded-source'].includes(result.state) && (
        <div className="hvc-state-panel" data-state={result.state} role="status">
          <strong>{result.diagnostic ? clinicalFailureLabel(result.diagnostic.category) : clinicalStateLabel(result.state)}</strong>
          <p>{result.message}</p>
          {result.state === 'error' && (
            <button className="hvc-retry" type="button" onClick={() => setRequestVersion(version => version + 1)}>Retry evidence service</button>
          )}
        </div>
      )}

      <nav className="hvc-lanes" aria-label="Clinical workspace views">
        {(Object.keys(viewLabels) as ClinicalView[]).map(view => (
          <button
            className="hvc-lane"
            data-active={activeView === view}
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
          >
            {viewLabels[view]}
          </button>
        ))}
      </nav>

      {activeView === 'interactions' ? (
        <div className="hvc-boundary" role="note">
          <strong>Structured drug–cannabinoid interaction checker is not yet published</strong>
          <p>The repository defines an interaction contract but does not yet expose a governed reviewed interaction dataset. Clinical therefore does not infer interaction severity or patient-specific compatibility.</p>
          {safetyAuthority && <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">Health Canada safety guidance ↗</a>}
        </div>
      ) : activeView === 'monitoring' ? (
        <div className="hvc-boundary" role="note">
          <strong>Governed monitoring and reassessment protocol is not yet published</strong>
          <p>The repository has a monitoring contract but no reviewed production dataset that supports patient-specific goals, intervals or discontinuation rules. Use the primary professional authorities and existing reviewed education until that contract is populated.</p>
          <a className="hvm2-text-link" href="/network/clinical-education">Reviewed clinical education →</a>
        </div>
      ) : activeView === 'safety' && visibleRecords.length === 0 ? (
        <div className="hvc-boundary" role="note">
          <strong>No structured safety record matches the current evidence scope</strong>
          <p>Do not interpret this as absence of risk. Use current primary safety guidance while the governed evidence corpus is expanded.</p>
          {safetyAuthority && <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">Health Canada safety guidance ↗</a>}
          {pharmacovigilanceAuthority && <><br /><a className="hvm2-text-link" href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer">Adverse-reaction reporting ↗</a></>}
        </div>
      ) : activeView === 'formulations' && visibleRecords.length === 0 ? (
        <div className="hvc-boundary" role="note">
          <strong>No reviewed formulation-specific record matches this scope</strong>
          <p>Clinical keeps regulated cannabinoid drugs, isolates, cannabis-derived formulations and general cannabis evidence distinct. It does not transfer evidence between those classes without an explicit reviewed record.</p>
        </div>
      ) : activeView === 'guidelines' && visibleRecords.length === 0 ? (
        <div className="hvc-boundary" role="note">
          <strong>No published clinical-guideline record matches this scope</strong>
          <p>Private intake candidates and unreviewed source identifications are not surfaced as clinical guidance.</p>
        </div>
      ) : activeView === 'practice' && visibleRecords.length === 0 ? (
        <div className="hvc-boundary" role="note">
          <strong>No reviewed practice record matches this scope</strong>
          <p>Federal primary authorities remain available below. Province- and profession-specific authorization rules are not inferred from the Command role alone.</p>
          {documentAuthority && <a className="hvm2-text-link" href={documentAuthority.href} target="_blank" rel="noreferrer">Medical document authority ↗</a>}
        </div>
      ) : (
        <div className="hvc-results" aria-label={`${viewLabels[activeView]} clinical records`}>
          <div className="hvc-results-head">
            <h3>{viewLabels[activeView]}</h3>
            <span>{visibleRecords.length} reviewed record{visibleRecords.length === 1 ? '' : 's'}</span>
          </div>

          {!loading && result?.synthesis && result.synthesis.recordCount > 0 && activeView === 'evidence' && (
            <div className="hvc-state-panel" data-state={result.synthesis.hasMaterialConflict ? 'conflicted' : result.state} aria-label="Evidence set summary">
              <strong>{result.synthesis.currentRecordCount} current · {result.synthesis.gradedRecordCount} graded · {result.synthesis.ungradedRecordCount} ungraded</strong>
              <p>{result.synthesis.regulatedDrugRecordCount} regulated-drug · {result.synthesis.generalCannabisRecordCount} general-cannabis / authority. Counts describe the reviewed corpus only; they do not infer efficacy or comparative superiority.</p>
            </div>
          )}

          {visibleRecords.map(record => (
            <details className="hvc-record" key={record.id}>
              <summary>
                <span>
                  <small>{record.condition || 'Regulatory / professional evidence'}</small>
                  <strong>{record.title}</strong>
                </span>
                <span className="hvc-record-state">{formatStatus(record.evidenceStrength)}</span>
              </summary>
              <div className="hvc-record-body">
                <p>{record.summary}</p>
                <dl className="hvc-facts">
                  <dt>Evidence</dt><dd>{formatStatus(record.evidenceType)} · {formatStatus(record.evidenceStrength)}</dd>
                  <dt>Class</dt><dd>{evidenceClassLabel(record)}</dd>
                  {record.formulation && <><dt>Formulation</dt><dd>{record.formulation}</dd></>}
                  {record.cannabinoid.length > 0 && <><dt>Cannabinoid</dt><dd>{record.cannabinoid.join(', ')}</dd></>}
                  {record.population && <><dt>Population</dt><dd>{record.population}</dd></>}
                  {record.intervention && <><dt>Intervention</dt><dd>{record.intervention}</dd></>}
                  {record.comparator && <><dt>Comparator</dt><dd>{record.comparator}</dd></>}
                  {record.outcome && <><dt>Outcome</dt><dd>{record.outcome}</dd></>}
                  <dt>Currentness</dt><dd>{formatStatus(record.freshnessStatus ?? 'current')} · {formatStatus(record.supersessionState)}</dd>
                  <dt>Jurisdiction</dt><dd>{record.jurisdiction.join(', ') || 'Not encoded'}</dd>
                  <dt>Profession</dt><dd>{record.professionRelevance.length ? record.professionRelevance.map(formatStatus).join(', ') : 'Not encoded'}</dd>
                  <dt>Verified</dt><dd>{date(record.verifiedAt)}{record.effectiveDate ? ` · effective ${date(record.effectiveDate)}` : ''}</dd>
                </dl>
                {record.uncertainty && <p><strong>Uncertainty:</strong> {record.uncertainty}</p>}
                {record.conflictStatus !== 'none' && <p><strong>Conflict:</strong> {formatStatus(record.conflictStatus)}</p>}
                {record.freshnessReason && <p><strong>Currentness note:</strong> {record.freshnessReason}</p>}
                <p><strong>Primary source:</strong> {record.primarySource.publisher} · {record.primarySource.title}</p>
                <a className="hvm2-text-link" href={record.primarySource.url} target="_blank" rel="noreferrer">Open primary source ↗</a>
              </div>
            </details>
          ))}

          {!loading && visibleRecords.length === 0 && activeView === 'evidence' && (
            <div className="hvc-boundary" role="status">
              <strong>{result ? clinicalStateLabel(result.state) : 'No evidence loaded'}</strong>
              <p>{result?.message ?? 'Retry the evidence service.'}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
