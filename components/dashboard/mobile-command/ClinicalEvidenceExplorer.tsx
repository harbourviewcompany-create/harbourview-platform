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
type EvidenceDomain = 'clinical' | 'preclinical' | 'regulatory' | 'mixed' | 'other' | 'not-assessed'
type EvidenceRecordWithDomain = ClinicalEvidenceRecordDTO & { evidenceDomain?: EvidenceDomain }

function commandParams(commandHref: string): URLSearchParams {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  return new URLSearchParams(query)
}

function jurisdictionFromCommandHref(commandHref: string): string {
  const iso = countryIso2FromCommandHref(commandHref)
  if (iso) return clinicalJurisdictionLabel(iso)
  const raw = commandParams(commandHref).get('country')?.trim() ?? ''
  return raw
}

function roleFromCommandHref(commandHref: string): string {
  const raw = commandParams(commandHref).get('role')?.trim() ?? ''
  return raw ? formatStatus(raw) : 'All roles'
}

function date(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : 'Not recorded'
}

function evidenceDomain(record: ClinicalEvidenceRecordDTO): EvidenceDomain {
  return (record as EvidenceRecordWithDomain).evidenceDomain ?? 'not-assessed'
}

function recordHasClaim(record: ClinicalEvidenceRecordDTO, kinds: string[]): boolean {
  return (record.claims ?? []).some(claim => kinds.includes(claim.claimKind))
}

function recordIsSafety(record: ClinicalEvidenceRecordDTO): boolean {
  const searchable = [record.title, record.summary, record.outcome, record.uncertainty]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
  return recordHasClaim(record, ['safety', 'tolerability'])
    || record.evidenceType === 'pharmacovigilance-signal'
    || /safety|adverse|contraindicat|interaction|tolerab/.test(searchable)
}

function recordsForView(records: ClinicalEvidenceRecordDTO[], view: ClinicalView): ClinicalEvidenceRecordDTO[] {
  if (view === 'safety') return records.filter(recordIsSafety)
  if (view === 'interactions') return records.filter(record => recordHasClaim(record, ['interaction']))
  if (view === 'monitoring') return records.filter(record => recordHasClaim(record, ['monitoring']))
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
  if (result.state === 'no-evidence') return { title: 'Known concept, no reviewed record', detail: 'The query resolved to governed terminology, but no eligible published evidence record matches this context.' }
  if (result.state === 'no-match') return { title: 'No reviewed match', detail: 'No governed concept or published evidence record matched this question.' }

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

  function searchCanonicalConcept() {
    const canonical = result?.resolution?.canonicalLabel
    if (!canonical) return
    setQuery(canonical)
    setSubmittedQuery(canonical)
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
  const resolution = submittedQuery ? result?.resolution : undefined
  const corpus = result?.corpus

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
        #clinical.hvm2-section { padding-bottom: max(116px, calc(96px + env(safe-area-inset-bottom))); }
        #clinical > .hvm2-section-heading { gap: 8px; margin-bottom: 10px; }
        #clinical > .hvm2-section-heading h2 { margin: 3px 0 4px; font-size: clamp(1.75rem, 6.8vw, 2.35rem); line-height: 1.02; }
        #clinical > .hvm2-section-heading p { max-width: 58rem; margin: 0; font-size: 0.88rem; line-height: 1.42; }
        #clinical > .hvm2-section-heading > .hvm2-text-link { align-self: end; white-space: nowrap; }
        #clinical > .hvm2-compliance-grid { display: none; }
        #clinical > .hvm2-sourcing-note { margin-top: 12px; padding: 11px 13px; }
        #clinical .hvc-command { display: grid; gap: 12px; margin-top: 4px; }
        #clinical .hvc-statusbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 38px; padding: 8px 10px; border: 1px solid rgba(214,178,92,.18); border-radius: 12px; background: rgba(255,255,255,.025); }
        #clinical .hvc-statusbar strong { font-size: .78rem; }
        #clinical .hvc-state { flex: 0 0 auto; padding: 4px 8px; border: 1px solid rgba(214,178,92,.28); border-radius: 999px; color: #e7c875; font-size: .68rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
        #clinical .hvc-now-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }
        #clinical .hvc-now-card, #clinical .hvc-corpus, #clinical .hvc-resolution { min-width: 0; padding: 11px; border: 1px solid rgba(255,255,255,.09); border-radius: 14px; background: rgba(255,255,255,.025); }
        #clinical .hvc-now-card > span, #clinical .hvc-block-label, #clinical .hvc-corpus > span, #clinical .hvc-resolution > span { display: block; margin-bottom: 4px; color: #d9b85d; font-size: .67rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        #clinical .hvc-now-card strong, #clinical .hvc-corpus strong, #clinical .hvc-resolution strong { display: block; font-size: .88rem; line-height: 1.25; }
        #clinical .hvc-now-card p, #clinical .hvc-corpus p, #clinical .hvc-resolution p { margin: 5px 0 0; color: rgba(236,236,236,.72); font-size: .74rem; line-height: 1.38; }
        #clinical .hvc-corpus-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; margin-top: 9px; }
        #clinical .hvc-corpus-metric { padding: 8px; border-radius: 10px; background: rgba(0,0,0,.16); }
        #clinical .hvc-corpus-metric b { display: block; font-size: .9rem; }
        #clinical .hvc-corpus-metric small { color: rgba(236,236,236,.55); font-size: .64rem; line-height: 1.2; }
        #clinical .hvc-corpus details { margin-top: 9px; font-size: .72rem; }
        #clinical .hvc-corpus summary { color: #e7c875; cursor: pointer; font-weight: 800; }
        #clinical .hvc-ask { padding: 12px; border: 1px solid rgba(214,178,92,.24); border-radius: 15px; background: rgba(7,17,31,.72); }
        #clinical .hvc-ask h3 { margin: 0; font-size: 1rem; }
        #clinical .hvc-ask > p { margin: 4px 0 10px; color: rgba(236,236,236,.66); font-size: .76rem; line-height: 1.4; }
        #clinical .hvc-search-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
        #clinical .hvc-search-row input { width: 100%; min-width: 0; min-height: 44px; padding: 0 12px; border: 1px solid rgba(255,255,255,.14); border-radius: 11px; background: rgba(0,0,0,.22); color: inherit; }
        #clinical .hvc-search-row button, #clinical .hvc-retry, #clinical .hvc-lane, #clinical .hvc-recovery-action { min-height: 44px; border: 1px solid rgba(214,178,92,.28); border-radius: 11px; background: rgba(214,178,92,.07); color: #e7c875; font: inherit; font-size: .78rem; font-weight: 800; }
        #clinical .hvc-search-scope { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; color: rgba(236,236,236,.6); font-size: .7rem; }
        #clinical .hvc-search-scope button { padding: 0; border: 0; background: transparent; color: #e7c875; font: inherit; font-weight: 800; }
        #clinical .hvc-resolution[data-recognized="true"] { border-color: rgba(214,178,92,.3); }
        #clinical .hvc-term-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
        #clinical .hvc-term-chip { padding: 3px 7px; border: 1px solid rgba(255,255,255,.09); border-radius: 999px; color: rgba(236,236,236,.68); font-size: .64rem; }
        #clinical .hvc-state-panel { padding: 11px 12px; border: 1px solid rgba(255,255,255,.09); border-radius: 13px; background: rgba(255,255,255,.02); }
        #clinical .hvc-state-panel[data-state="error"], #clinical .hvc-state-panel[data-state="permission"], #clinical .hvc-state-panel[data-state="stale"], #clinical .hvc-state-panel[data-state="conflicted"], #clinical .hvc-state-panel[data-state="degraded-source"] { border-color: rgba(214,178,92,.34); }
        #clinical .hvc-state-panel strong { display: block; font-size: .84rem; }
        #clinical .hvc-state-panel p { margin: 4px 0 0; color: rgba(236,236,236,.68); font-size: .74rem; line-height: 1.4; }
        #clinical .hvc-retry { width: auto; min-height: 36px; margin-top: 8px; padding: 0 12px; }
        #clinical .hvc-zero-recovery { display: grid; gap: 7px; margin-top: 9px; }
        #clinical .hvc-recovery-action { width: fit-content; min-height: 36px; padding: 0 10px; }
        #clinical .hvc-lanes { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 6px; }
        #clinical .hvc-lane { min-height: 38px; padding: 6px 4px; border-color: rgba(255,255,255,.09); background: rgba(255,255,255,.025); color: rgba(236,236,236,.72); font-size: .68rem; }
        #clinical .hvc-lane[data-active="true"] { border-color: rgba(214,178,92,.38); background: rgba(214,178,92,.09); color: #e7c875; }
        #clinical .hvc-results { display: grid; gap: 8px; }
        #clinical .hvc-results-head { display: flex; align-items: end; justify-content: space-between; gap: 8px; }
        #clinical .hvc-results-head h3 { margin: 0; font-size: 1rem; }
        #clinical .hvc-results-head span { color: rgba(236,236,236,.5); font-size: .7rem; }
        #clinical .hvc-record { overflow: hidden; border: 1px solid rgba(255,255,255,.09); border-radius: 13px; background: rgba(255,255,255,.02); }
        #clinical .hvc-record summary { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px; padding: 11px 12px; cursor: pointer; list-style: none; }
        #clinical .hvc-record summary::-webkit-details-marker { display: none; }
        #clinical .hvc-record summary small, #clinical .hvc-record summary strong { display: block; }
        #clinical .hvc-record summary small { margin-bottom: 3px; color: #d9b85d; font-size: .66rem; font-weight: 800; text-transform: uppercase; }
        #clinical .hvc-record summary strong { font-size: .86rem; line-height: 1.25; }
        #clinical .hvc-record-state { align-self: start; padding: 3px 6px; border: 1px solid rgba(255,255,255,.1); border-radius: 999px; color: rgba(236,236,236,.58); font-size: .62rem; white-space: nowrap; }
        #clinical .hvc-record-body { display: grid; gap: 8px; padding: 0 12px 12px; color: rgba(236,236,236,.74); font-size: .75rem; line-height: 1.42; }
        #clinical .hvc-record-body p { margin: 0; }
        #clinical .hvc-facts { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 4px 9px; margin: 0; }
        #clinical .hvc-facts dt { color: rgba(236,236,236,.45); }
        #clinical .hvc-facts dd { min-width: 0; margin: 0; }
        #clinical .hvc-provenance { display: grid; gap: 6px; padding: 8px; border-left: 2px solid rgba(214,178,92,.22); background: rgba(0,0,0,.12); }
        #clinical .hvc-provenance strong { font-size: .72rem; }
        #clinical .hvc-provenance small { color: rgba(236,236,236,.58); }
        #clinical .hvc-boundary { padding: 12px; border: 1px dashed rgba(214,178,92,.24); border-radius: 13px; }
        #clinical .hvc-boundary strong { display: block; font-size: .83rem; }
        #clinical .hvc-boundary p { margin: 5px 0 0; color: rgba(236,236,236,.66); font-size: .74rem; line-height: 1.42; }
        #clinical .hvc-boundary a { display: inline-block; margin-top: 7px; }
        #clinical > .hvm2-horizontal-deck, #clinical > .hvm2-two-column { margin-top: 12px; }
        @media (max-width: 559px) {
          #clinical > .hvm2-section-heading { display: block; }
          #clinical > .hvm2-section-heading > .hvm2-text-link { display: inline-block; margin-top: 6px; font-size: .78rem; }
          #clinical .hvc-search-row { grid-template-columns: 1fr; }
          #clinical .hvc-lanes { grid-template-columns: repeat(4,minmax(0,1fr)); }
          #clinical .hvc-lane { min-height: 36px; }
        }
        @media (max-width: 374px) {
          #clinical .hvc-now-grid { grid-template-columns: 1fr; }
          #clinical .hvc-lanes { grid-template-columns: repeat(3,minmax(0,1fr)); }
          #clinical .hvc-corpus-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
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

      {corpus && (
        <section className="hvc-corpus" aria-label="Governed corpus coverage" data-testid="clinical-corpus-profile">
          <span>Corpus coverage</span>
          <strong>{corpus.recordCount} eligible reviewed records · {corpus.conditionCount} linked conditions</strong>
          <div className="hvc-corpus-grid">
            <div className="hvc-corpus-metric"><b>{corpus.currentRecordCount}</b><small>current records</small></div>
            <div className="hvc-corpus-metric"><b>{corpus.gradedRecordCount}</b><small>clinically graded</small></div>
            <div className="hvc-corpus-metric"><b>{corpus.conceptCount}</b><small>governed concepts</small></div>
            <div className="hvc-corpus-metric"><b>{corpus.sourceCount}</b><small>registered sources</small></div>
            <div className="hvc-corpus-metric"><b>{corpus.studyFamilyCount}</b><small>normalized families</small></div>
            <div className="hvc-corpus-metric"><b>{corpus.claimCount}</b><small>claim anchors</small></div>
          </div>
          <p>{corpus.studyFamilyCount > 0 ? `${corpus.independentStudyCount} reviewed independent-study families are represented.` : 'Independent-study/publication-family normalization is not yet populated for this corpus scope; publication counts are not presented as independent studies.'}</p>
          <details>
            <summary>Governance methodology</summary>
            <p>{corpus.gradingMethodTitle ? `${corpus.gradingMethodTitle}${corpus.gradingMethodVersion ? ` · v${corpus.gradingMethodVersion}` : ''}.` : 'No active grading-method metadata is published for this scope.'} Eligibility is limited to published reviewed records; withdrawn registered primary sources are excluded. Stale and superseded evidence remains visible as such rather than being silently treated as current.</p>
            <p>Last corpus verification represented here: {date(corpus.lastVerifiedAt)}. Coverage describes this governed corpus only, not the universe of external clinical literature.</p>
          </details>
        </section>
      )}

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

      {!loading && submittedQuery && resolution && (
        <section className="hvc-resolution" data-recognized={resolution.recognized} aria-label="Governed concept resolution">
          <span>{resolution.recognized ? 'Recognized concept' : 'Terminology resolution'}</span>
          <strong>{resolution.canonicalLabel ?? 'No governed concept resolved'}</strong>
          {resolution.recognized ? (
            <>
              <p>Matched deterministically against the reviewed concept vocabulary. Evidence retrieval expands only through published canonical terms and sourced aliases.</p>
              {resolution.expandedTerms.length > 0 && (
                <div className="hvc-term-chips" aria-label="Expanded governed search terms">
                  {resolution.expandedTerms.slice(0, 8).map(term => <span className="hvc-term-chip" key={term}>{term}</span>)}
                </div>
              )}
            </>
          ) : (
            <p>No published concept matched this wording. Direct governed-record fields are still searched; this state does not mean the external literature contains no evidence.</p>
          )}
        </section>
      )}

      {!loading && result && ['error', 'permission', 'no-match', 'no-evidence', 'stale', 'conflicted', 'degraded-source'].includes(result.state) && (
        <div className="hvc-state-panel" data-state={result.state} role="status">
          <strong>{result.diagnostic ? clinicalFailureLabel(result.diagnostic.category) : clinicalStateLabel(result.state)}</strong>
          <p>{result.message}</p>
          {result.state === 'no-evidence' && resolution?.canonicalLabel && (
            <div className="hvc-zero-recovery">
              <p>Recognized as <strong>{resolution.canonicalLabel}</strong>. The zero result means no eligible reviewed record is published for this jurisdiction/query—not that no external evidence exists.</p>
              {resolution.canonicalLabel.toLocaleLowerCase() !== submittedQuery.toLocaleLowerCase() && (
                <button className="hvc-recovery-action" type="button" onClick={searchCanonicalConcept}>Search canonical term</button>
              )}
            </div>
          )}
          {result.state === 'no-match' && (
            <div className="hvc-zero-recovery">
              <p>{resolution?.recognized ? 'A governed concept resolved, but the current evidence and jurisdiction filters produced no eligible record.' : 'The terminology did not resolve to a governed concept and no reviewed record matched directly. Clear the search or use a canonical clinical term.'}</p>
              <button className="hvc-recovery-action" type="button" onClick={clearSearch}>Clear search</button>
            </div>
          )}
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

      {activeView === 'interactions' && visibleRecords.length === 0 ? (
        <div className="hvc-boundary" role="note">
          <strong>Structured drug–cannabinoid interaction evidence is not published for this scope</strong>
          <p>Clinical does not infer interaction severity or patient-specific compatibility. A future interaction result must be backed by a published governed record and claim-level source anchor.</p>
          {safetyAuthority && <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">{safetyAuthority.sourceName} ↗</a>}
        </div>
      ) : activeView === 'monitoring' && visibleRecords.length === 0 ? (
        <div className="hvc-boundary" role="note">
          <strong>Governed monitoring and reassessment evidence is not published for this scope</strong>
          <p>The repository defines a monitoring contract, but Clinical does not synthesize patient-specific goals, intervals or discontinuation rules without reviewed evidence and provenance.</p>
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
          <p>Jurisdiction-specific primary authorities should be used directly. Profession-specific authorization rules are not inferred from the Command role alone.</p>
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
              <strong>
                {result.synthesis.currentRecordCount} current · {result.synthesis.gradedRecordCount} graded · {result.synthesis.ungradedRecordCount} ungraded
                {result.synthesis.independentStudyCount !== null && result.synthesis.independentStudyCount !== undefined ? ` · ${result.synthesis.independentStudyCount} independent studies` : ''}
              </strong>
              <p>{result.synthesis.regulatedDrugRecordCount} regulated-drug · {result.synthesis.generalCannabisRecordCount} general-cannabis / authority · {result.synthesis.claimCount ?? 0} claim anchors. Counts describe the reviewed corpus only; they do not infer efficacy or comparative superiority.</p>
              {(result.synthesis.studyFamilyCount ?? 0) === 0 && <p>Publication-family normalization is not yet populated for this result set, so source-record count is not presented as independent-study count.</p>}
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
                  <dt>Domain</dt><dd>{formatStatus(evidenceDomain(record))}</dd>
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

                {(record.studyFamilies ?? []).length > 0 ? (
                  <div className="hvc-provenance" aria-label="Publication family normalization">
                    <strong>Publication / study family</strong>
                    {(record.studyFamilies ?? []).map(family => (
                      <small key={`${record.id}-${family.familyKey}`}>{family.title} · {formatStatus(family.publicationRole)}{family.countsAsIndependentStudy ? ' · independent-study family' : ''}{family.trialRegistryId ? ` · ${family.trialRegistryId}` : ''}</small>
                    ))}
                  </div>
                ) : (
                  <p><strong>Publication family:</strong> Not yet linked; this source record is not automatically counted as an independent study.</p>
                )}

                {(record.claims ?? []).length > 0 ? (
                  <div className="hvc-provenance" aria-label="Claim-level provenance">
                    <strong>Claim-level provenance</strong>
                    {(record.claims ?? []).map(claim => (
                      <span key={claim.id}>
                        {claim.statement}<br />
                        <small>{formatStatus(claim.claimKind)} · {formatStatus(claim.claimOrigin)} · locator {claim.sourceLocator} · verified {date(claim.verifiedAt)}</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p><strong>Claim provenance:</strong> Record-level primary-source provenance only; no published claim anchor is attached to this record.</p>
                )}

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
