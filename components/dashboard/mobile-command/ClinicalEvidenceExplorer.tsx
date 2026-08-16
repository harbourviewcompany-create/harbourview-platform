'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'
import {
  classifyClinicalFailure,
  clinicalFailureLabel,
  clinicalStateLabel,
  diagnosticForFailure,
  isClinicalEvidenceApiResult,
  type ClinicalEvidenceApiResult,
} from '@/lib/clinical/runtime'
import {
  clinicalJurisdictionLabel,
  countryIso2FromCommandHref,
  getClinicalAuthoritiesForCountry,
} from './clinicalCommandContract'
import { formatStatus } from './contracts'

type ClinicalView = 'evidence' | 'safety' | 'interactions' | 'formulations' | 'guidelines' | 'practice' | 'monitoring'

function commandParams(commandHref: string): URLSearchParams {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  return new URLSearchParams(query)
}

function jurisdictionFromCommandHref(commandHref: string): string {
  const iso = countryIso2FromCommandHref(commandHref)
  if (iso) return clinicalJurisdictionLabel(iso)
  const raw = commandParams(commandHref).get('country')?.trim() ?? ''
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

function clientFailureMessage(category: ReturnType<typeof classifyClinicalFailure>): string {
  const messages = {
    configuration: 'Clinical evidence is not configured in this deployment.',
    'environment-mismatch': 'Clinical evidence is connected to an unexpected data environment. Do not rely on this workspace until deployment configuration is corrected.',
    'missing-route': 'The Clinical evidence API route is unavailable in this deployment.',
    permission: 'Clinical evidence is not available to this access context.',
    'migration-drift': 'The Clinical evidence schema is not activated for this deployment.',
    schema: 'Clinical evidence returned a response that does not match the reviewed application contract.',
    upstream: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
    unknown: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
  }
  return messages[category]
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
        const message = error instanceof Error ? error.message : ''
        const category = classifyClinicalFailure({ message })
        const permission = category === 'permission'
        const statusMatch = message.match(/clinical_evidence_http_(\d{3})/)
        const httpStatus = statusMatch ? Number(statusMatch[1]) : null
        setResult({
          state: permission ? 'permission' : 'error',
          query: submittedQuery,
          records: [],
          changes: [],
          message: clientFailureMessage(category),
          diagnostic: diagnosticForFailure(category, httpStatus),
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
  const countryIso2 = countryIso2FromCommandHref(commandHref)
  const authorities = getClinicalAuthoritiesForCountry(countryIso2)
  const safetyAuthority = authorities.find(source => source.id === 'safety-interactions')
  const documentAuthority = authorities.find(source => source.id === 'medical-document')
  const pharmacovigilanceAuthority = authorities.find(source => source.id === 'pharmacovigilance')

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
          {result.state === 'error' && result.diagnostic?.retryable !== false && (
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
          {safetyAuthority && <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">{safetyAuthority.sourceName} ↗</a>}
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
          {safetyAuthority && <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">{safetyAuthority.sourceName} ↗</a>}
          {pharmacovigilanceAuthority && <><br /><a className="hvm2-text-link" href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer">{pharmacovigilanceAuthority.label} ↗</a></>}
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
          <p>Primary authorities remain available below when registered for this jurisdiction. Province- and profession-specific authorization rules are not inferred from the Command role alone.</p>
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
                  <dt>Profession</dt><dd>{record.professionRelevance.length ? record.professionRelevance.map(value => formatStatus(value)).join(', ') : 'Not encoded'}</dd>
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
