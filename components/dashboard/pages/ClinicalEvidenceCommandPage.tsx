'use client'

import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { JURISDICTION_BRIEFINGS, PROFESSIONAL_PATHWAYS, getAttentionItems } from '@/lib/fixtures/clinical/jurisdictions'
import type { ClinicalEvidenceChangeEventDTO, ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'
import {
  derivePrescriberReadiness,
  isInspectableClinicalSource,
  type AskClinicalResponse,
  type PrescriberWorkspaceTab,
} from '@/lib/clinical/prescriber'

export type ClinicalEvidenceCommandPageProps = {
  countryLabel: string
  countryIso2?: string | null
  roleLabel?: string
}

type InteractionRow = {
  id: string
  medicationIngredient: string
  cannabinoid: string
  mechanism: string | null
  clinicalSignificance: string
  evidenceCertainty: string
  uncertainty: string | null
  monitoringConsideration: string | null
  primarySourceTitle: string
  primarySourceUrl: string | null
}

type EducationModule = {
  id: string
  slug: string
  title: string
  route?: string
  moduleStatus?: string
}

type EvidenceEnvelope = {
  state?: string
  message?: string
  records?: ClinicalEvidenceRecordDTO[]
  changes?: ClinicalEvidenceChangeEventDTO[]
}

const tabs: Array<{ key: PrescriberWorkspaceTab; label: string }> = [
  { key: 'decision', label: 'Decision' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'safety', label: 'Safety' },
  { key: 'products', label: 'Products' },
  { key: 'regimen', label: 'Regimen' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'guidelines', label: 'Guidelines' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'history', label: 'History' },
]

const card = 'rounded-xl border border-white/10 bg-[#161b22]'
const muted = 'text-white/55'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#d4a853]/80">{children}</div>
}

function StateBadge({ state }: { state: string }) {
  const normalized = state.replace(/_/g, '-').toLowerCase()
  const good = ['loaded', 'ready', 'current', 'published'].includes(normalized)
  const warn = ['stale', 'conflicting', 'conflicted', 'review-required', 'under-review', 'attention', 'moderate', 'major'].includes(normalized)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
      good ? 'bg-emerald-500/15 text-emerald-300' : warn ? 'bg-amber-500/15 text-amber-300' : 'bg-white/8 text-white/60'
    }`}>
      {normalized.replace(/-/g, ' ')}
    </span>
  )
}

function SourceLink({ url, children }: { url: string | null | undefined; children?: React.ReactNode }) {
  if (!isInspectableClinicalSource(url)) return <span className="text-amber-300">Source review required</span>
  return <a href={url!} target="_blank" rel="noreferrer" className="text-[#d4a853] hover:underline">{children ?? 'Open source ↗'}</a>
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[.025] p-4">
      <p className="text-sm font-medium text-white/80">{title}</p>
      <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{body}</p>
    </div>
  )
}

export default function ClinicalEvidenceCommandPage({ countryLabel, countryIso2 = 'BR', roleLabel = 'All roles' }: ClinicalEvidenceCommandPageProps) {
  const iso2 = (countryIso2 || 'BR').toUpperCase()
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PrescriberWorkspaceTab>('decision')
  const [query, setQuery] = useState('')
  const [askQuestion, setAskQuestion] = useState('')
  const [askResult, setAskResult] = useState<AskClinicalResponse | null>(null)
  const [records, setRecords] = useState<ClinicalEvidenceRecordDTO[]>([])
  const [changes, setChanges] = useState<ClinicalEvidenceChangeEventDTO[]>([])
  const [evidenceState, setEvidenceState] = useState('loading')
  const [evidenceMessage, setEvidenceMessage] = useState('')
  const [formulary, setFormulary] = useState<FormularyProductDTO[]>([])
  const [interactions, setInteractions] = useState<InteractionRow[]>([])
  const [modules, setModules] = useState<EducationModule[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const briefing = JURISDICTION_BRIEFINGS[iso2] ?? null
  const pathway = PROFESSIONAL_PATHWAYS[iso2] ?? null
  const attention = getAttentionItems(iso2)

  const inspectableEvidence = useMemo(() => records.filter((record) => (
    record.reviewStatus === 'published' &&
    record.supersessionState === 'current' &&
    record.publicationScope === 'clinical-synthesis' &&
    isInspectableClinicalSource(record.primarySource?.url)
  )), [records])

  const inspectableInteractions = useMemo(
    () => interactions.filter((row) => isInspectableClinicalSource(row.primarySourceUrl)),
    [interactions],
  )

  const inspectableProducts = useMemo(
    () => formulary.filter((product) => product.reviewStatus === 'published' && isInspectableClinicalSource(product.primarySourceUrl)),
    [formulary],
  )

  const sourceBlockedCount = (records.length - inspectableEvidence.length) + (interactions.length - inspectableInteractions.length)

  const readiness = useMemo(() => derivePrescriberReadiness({
    hasClinicalContext: false,
    hasInspectableEvidence: inspectableEvidence.length > 0,
    authorityKnown: false,
    authorityAllowsAction: false,
    productResolved: inspectableProducts.length > 0,
    unresolvedMajorSafetyItems: inspectableInteractions.filter((row) => row.clinicalSignificance === 'major').length,
    monitoringDefined: false,
    consentConfirmed: false,
  }), [inspectableEvidence, inspectableInteractions, inspectableProducts])

  const loadEvidence = useCallback(async (q: string) => {
    setError(null)
    const params = new URLSearchParams({ jurisdiction: iso2, limit: '30' })
    if (q.trim()) params.set('q', q.trim())
    const response = await fetch(`/api/clinical/evidence?${params}`)
    const body = await response.json().catch(() => ({})) as EvidenceEnvelope
    if (!response.ok) {
      setEvidenceState(response.status === 403 ? 'permission' : 'error')
      setEvidenceMessage(body.message ?? `Evidence API ${response.status}`)
      setRecords([])
      setChanges([])
      setError(body.message ?? `Evidence API ${response.status}`)
      return
    }
    setRecords(Array.isArray(body.records) ? body.records : [])
    setChanges(Array.isArray(body.changes) ? body.changes : [])
    setEvidenceState(body.state ?? 'empty')
    setEvidenceMessage(body.message ?? '')
  }, [iso2])

  const loadFormulary = useCallback(async () => {
    const response = await fetch(`/api/clinical/formulary?country=${encodeURIComponent(iso2)}&limit=50`)
    const body = await response.json().catch(() => ({})) as { products?: FormularyProductDTO[] }
    setFormulary(Array.isArray(body.products) ? body.products : [])
  }, [iso2])

  const loadInteractions = useCallback(async () => {
    const response = await fetch('/api/clinical/interactions?limit=50')
    const body = await response.json().catch(() => ({})) as { interactions?: InteractionRow[] }
    setInteractions(Array.isArray(body.interactions) ? body.interactions : [])
  }, [])

  const loadEducation = useCallback(async () => {
    const response = await fetch('/api/clinical/education')
    const body = await response.json().catch(() => ({})) as { modules?: EducationModule[] }
    setModules(Array.isArray(body.modules) ? body.modules : [])
  }, [])

  useEffect(() => {
    startTransition(() => {
      void loadEvidence('')
      void loadFormulary()
      void loadInteractions()
      void loadEducation()
    })
  }, [loadEducation, loadEvidence, loadFormulary, loadInteractions])

  function openWorkspace(tab: PrescriberWorkspaceTab) {
    setActiveTab(tab)
    setWorkspaceOpen(true)
  }

  async function askClinical() {
    if (askQuestion.trim().length < 2) return
    setAskResult(null)
    const params = new URLSearchParams({ q: askQuestion.trim(), jurisdiction: iso2, limit: '12' })
    const response = await fetch(`/api/clinical/ask?${params}`)
    const body = await response.json().catch(() => null) as AskClinicalResponse | null
    if (body) setAskResult(body)
  }

  return (
    <div className="space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <section className={`${card} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Clinical · {countryLabel}</SectionLabel>
            <h2 className="text-xl font-semibold leading-tight text-white">Prescriber command</h2>
            <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${muted}`}>
              Rapid triage for governed evidence, safety, products and professional context. Material claims require inspectable provenance; patient-specific decisions remain clinician-authored.
            </p>
          </div>
          <StateBadge state={isPending ? 'loading' : evidenceState} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['evidence', inspectableEvidence.length, 'Inspectable evidence'],
            ['safety', inspectableInteractions.length, 'Interaction records'],
            ['products', inspectableProducts.length, 'Inspectable products'],
            ['history', changes.length, 'Reviewed changes'],
          ].map(([tab, count, label]) => (
            <button key={String(tab)} type="button" onClick={() => openWorkspace(tab as PrescriberWorkspaceTab)} className="rounded-lg bg-white/[.04] p-3 text-left">
              <span className="block text-lg font-semibold text-white">{count}</span>
              <span className={`text-xs ${muted}`}>{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {sourceBlockedCount > 0 && <StateBadge state="review-required" />}
          <span className={`text-xs ${muted}`}>{roleLabel}</span>
          {attention.slice(0, 1).map((item) => <span key={item.id} className="text-xs text-amber-300">{item.title}</span>)}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => openWorkspace('decision')} className="rounded-lg bg-[#d4a853] px-4 py-2.5 text-sm font-semibold text-[#11161d]">Open Clinical workspace</button>
          <button type="button" onClick={() => openWorkspace('evidence')} className="rounded-lg border border-white/12 bg-white/[.04] px-4 py-2.5 text-sm font-semibold text-white/80">Ask Clinical</button>
        </div>
      </section>

      {!workspaceOpen && (
        <section className={`${card} p-4`}>
          <SectionLabel>What requires attention</SectionLabel>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {sourceBlockedCount > 0 ? (
            <p className="text-sm leading-relaxed text-amber-200/90">{sourceBlockedCount} loaded record(s) are withheld because record-level provenance or review requirements are incomplete.</p>
          ) : (
            <p className={`text-sm ${muted}`}>Open the full workspace for evidence, safety, product, regimen, monitoring, guideline and documentation review.</p>
          )}
        </section>
      )}

      {workspaceOpen && (
        <>
          <section className={`${card} p-3`}>
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <div><SectionLabel>Full Clinical workspace</SectionLabel><p className={`text-xs ${muted}`}>{countryLabel} · {roleLabel}</p></div>
              <button type="button" onClick={() => setWorkspaceOpen(false)} className="text-xs text-white/55">Close</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Clinical workspace">
              {tabs.map((tab) => (
                <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${activeTab === tab.key ? 'bg-[#d4a853]/20 text-[#d4a853]' : 'bg-white/[.05] text-white/60'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'decision' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Prescribing readiness</SectionLabel>
              <p className={`text-sm ${muted}`}>Inspectable completeness check only; this is not a recommendation to prescribe.</p>
              <div className="mt-4 space-y-2">
                {readiness.dimensions.map((dimension) => (
                  <div key={dimension.key} className="flex items-start justify-between gap-3 rounded-lg bg-white/[.03] p-3">
                    <div><p className="text-sm font-medium text-white/85">{dimension.label}</p><p className={`mt-1 text-xs ${muted}`}>{dimension.explanation}</p></div>
                    <StateBadge state={dimension.state} />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-amber-300">Overall: {readiness.state.replace(/-/g, ' ')}. Load a verified patient/encounter before any patient-specific action.</p>
            </section>
          )}

          {activeTab === 'evidence' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Ask Clinical · governed retrieval</SectionLabel>
              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void askClinical() }}>
                <input value={askQuestion} onChange={(event) => setAskQuestion(event.target.value)} placeholder="Ask a condition, formulation, outcome or safety question…" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35" />
                <button type="submit" className="rounded-lg bg-[#d4a853]/20 px-4 py-2.5 text-sm font-semibold text-[#d4a853]">Retrieve</button>
              </form>
              {askResult && (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/[.03] p-4">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-white/85">Answer from governed records</p><StateBadge state={askResult.state} /></div>
                  <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{askResult.answer}</p>
                  {askResult.unresolved.map((item) => <p key={item} className="mt-2 text-xs text-amber-300">{item}</p>)}
                  <div className="mt-3 space-y-2">
                    {askResult.citations.map((citation) => <div key={citation.evidenceRecordId} className="border-t border-white/8 pt-2 text-xs text-white/55">{citation.title} · {citation.evidenceStrength} · <SourceLink url={citation.sourceUrl}>{citation.sourceTitle} ↗</SourceLink></div>)}
                  </div>
                </div>
              )}
              <form className="mt-5" onSubmit={(event) => { event.preventDefault(); startTransition(() => void loadEvidence(query)) }}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search governed evidence corpus…" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35" />
              </form>
              <p className={`mt-2 text-xs ${muted}`}>{evidenceMessage || `State: ${evidenceState}`}</p>
              <div className="mt-4 space-y-3">
                {inspectableEvidence.length === 0 && <EmptyState title={records.length ? 'Evidence requires provenance review' : 'No matching governed evidence'} body={records.length ? 'Records exist, but none meet the current prescriber-inspectable source, review, clinical-synthesis and supersession contract.' : 'No reviewed evidence is available. Corpus absence is not converted into a negative clinical conclusion.'} />}
                {inspectableEvidence.map((record) => (
                  <article key={record.id} className="rounded-lg border border-white/8 bg-white/[.025] p-4">
                    <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-white/90">{record.title}</h3><StateBadge state={record.conflictStatus === 'conflicted' ? 'conflicting' : record.evidenceStrength} /></div>
                    <p className={`mt-2 text-xs ${muted}`}>{[record.condition, record.population, record.intervention, record.comparator, record.outcome].filter(Boolean).join(' · ')}</p>
                    <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{record.summary}</p>
                    {record.uncertainty && <p className="mt-2 text-xs text-amber-300">Uncertainty: {record.uncertainty}</p>}
                    <div className="mt-3 border-t border-white/8 pt-2 text-xs text-white/50">{record.primarySource.title} · verified {record.verifiedAt.slice(0, 10)} · <SourceLink url={record.primarySource.url}>Inspect source ↗</SourceLink></div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'safety' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Safety · interactions · special populations</SectionLabel>
              <p className={`text-sm ${muted}`}>Only record-level inspectable interaction sources are shown. Absence of a row never means absence of an interaction.</p>
              <div className="mt-4 space-y-2">
                {inspectableInteractions.length === 0 && <EmptyState title="No prescriber-inspectable interactions loaded" body="Generic landing-page interaction citations are withheld pending record-level source review." />}
                {inspectableInteractions.map((row) => (
                  <div key={row.id} className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/85">{row.medicationIngredient} × {row.cannabinoid}</p><StateBadge state={row.clinicalSignificance} /></div>
                    {row.mechanism && <p className={`mt-1 text-xs ${muted}`}>{row.mechanism}</p>}
                    {row.monitoringConsideration && <p className="mt-2 text-xs text-amber-300">{row.monitoringConsideration}</p>}
                    <p className={`mt-2 text-xs ${muted}`}>Certainty: {row.evidenceCertainty} · <SourceLink url={row.primarySourceUrl}>{row.primarySourceTitle} ↗</SourceLink></p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/45">Contraindication, precaution and special-population rules are schema-backed and remain review-gated until source-specific rows are loaded.</p>
            </section>
          )}

          {activeTab === 'products' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Products & formulary · {countryLabel}</SectionLabel>
              <p className={`text-sm ${muted}`}>Product/access status stays separate from efficacy evidence. Pharmaceutical, registered, unapproved/special-access and general-cannabis contexts must not be conflated.</p>
              <div className="mt-4 space-y-2">
                {formulary.length === 0 && <EmptyState title="No formulary rows loaded" body="No reviewed product/formulary record is available for this jurisdiction." />}
                {formulary.map((product) => (
                  <div key={product.id} className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white/90">{product.brandName || product.name}</p><p className={`mt-1 text-xs ${muted}`}>{product.productClass} · {product.authorizationStatus} · {(product.routes ?? []).join(', ') || 'route not loaded'}</p></div><StateBadge state={isInspectableClinicalSource(product.primarySourceUrl) ? product.reviewStatus : 'review-required'} /></div>
                    {product.strengthLabel && <p className={`mt-2 text-xs ${muted}`}>Strength: {product.strengthLabel}</p>}
                    <p className={`mt-2 text-xs ${muted}`}>{product.notes}</p>
                    <p className="mt-2 text-xs"><SourceLink url={product.primarySourceUrl}>Inspect authority ↗</SourceLink></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'regimen' && <section className={`${card} p-4`}><SectionLabel>Product-specific regimen</SectionLabel><EmptyState title="No reviewed product/indication regimen selected" body="The generic weight-based cannabinoid calculator is intentionally excluded. A regimen can become prescriber-visible only when tied to a governed product, indication, population, jurisdiction, source version and completed professional review." /><p className="mt-3 text-xs text-white/45">Legacy calculation records/APIs remain preserved behind their existing safety gate for compatibility; they are not promoted as prescribing guidance.</p></section>}

          {activeTab === 'monitoring' && <section className={`${card} p-4`}><SectionLabel>Monitoring & therapeutic objectives</SectionLabel><EmptyState title="Load a verified patient and encounter context" body="The new schema supports baseline requirements, therapeutic objectives, efficacy/safety measures, laboratory monitoring, reassessment schedules and stopping criteria. Nothing is inferred for an unidentified patient." /></section>}

          {activeTab === 'guidelines' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Guidelines & professional pathway</SectionLabel>
              {briefing ? <div className="space-y-3"><div className="rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/90">{briefing.country} jurisdiction context</p><p className={`mt-1 text-xs ${muted}`}>{briefing.summary}</p><p className={`mt-2 text-xs ${muted}`}>Primary authority: {briefing.primaryAuthority.name}</p><p className="mt-2 text-xs"><SourceLink url={briefing.primaryAuthority.url}>Open primary authority ↗</SourceLink></p></div>{pathway && <div className="rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/90">Professional pathway</p><p className={`mt-1 text-xs ${muted}`}>{pathway.whoMayPrescribe}</p><p className={`mt-2 text-xs ${muted}`}>Role scope: {pathway.roles} · reviewed {pathway.lastReviewed}</p></div>}</div> : <EmptyState title="No jurisdiction guideline context loaded" body="Professional authority is not inferred from an unsupported country label." />}
              <p className="mt-4 text-xs text-white/45">Guideline recommendations are modelled separately from evidence claims so conflicts and supersession can be represented without collapsing them into one score.</p>
            </section>
          )}

          {activeTab === 'documentation' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Documentation & shared decision</SectionLabel>
              <p className={`text-sm ${muted}`}>Existing verified-clinician, patient, care-team, consent, recommendation and prescription contracts are preserved. New decision records store clinician-authored rationale plus exact evidence-claim, product, guideline and unresolved-safety references.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href="/network/clinical-education" className="rounded-lg bg-white/[.04] p-3 text-sm font-medium text-[#d4a853]">Professional education →</Link><Link href="/network/clinical-education/request" className="rounded-lg bg-white/[.04] p-3 text-sm font-medium text-[#d4a853]">Request clinical education support →</Link></div>
              <p className="mt-3 text-xs text-white/45">Patient writes remain unavailable from generic Command until verified patient/encounter selection and consent checks are satisfied.</p>
            </section>
          )}

          {activeTab === 'history' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Clinical change history</SectionLabel>
              <div className="space-y-2">
                {changes.length === 0 && <EmptyState title="No reviewed material-change event loaded" body="This means no governed change event is available here; it does not mean nothing changed externally." />}
                {changes.map((change) => <div key={change.id} className="rounded-lg bg-white/[.03] p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/90">{change.title}</p><StateBadge state={change.materiality} /></div><p className={`mt-1 text-xs ${muted}`}>{change.summary}</p><p className={`mt-2 text-xs ${muted}`}>{change.occurredAt.slice(0, 10)} · <SourceLink url={change.primarySource.url}>{change.primarySource.title} ↗</SourceLink></p></div>)}
              </div>
              <p className="mt-4 text-xs text-white/45">Patient-impact review is schema-backed so reviewed change events can be matched for clinician review without automatically altering treatment.</p>
            </section>
          )}

          {modules.length > 0 && <section className={`${card} p-4`}><SectionLabel>Contextual professional education</SectionLabel><div className="flex gap-2 overflow-x-auto pb-1">{modules.slice(0, 6).map((module) => <Link key={module.id} href={module.route || `/network/clinical-education/${module.slug}`} className="min-w-[220px] rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/85">{module.title}</p><p className={`mt-1 text-xs ${muted}`}>{module.moduleStatus || 'Review state unavailable'}</p></Link>)}</div></section>}
        </>
      )}
    </div>
  )
}
