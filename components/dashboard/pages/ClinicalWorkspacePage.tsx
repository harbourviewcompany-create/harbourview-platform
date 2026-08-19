'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { AskClinicalResponse, PrescriberWorkspaceTab } from '@/lib/clinical/prescriber'
import type { ClinicalPrescriberWorkspaceDTO } from '@/lib/clinical/workspace'

type ClinicalPatientSummary = {
  id: string
  given_name: string
  family_name: string
  jurisdiction: string
  status?: string | null
}

type PatientsResponse = { patients?: ClinicalPatientSummary[]; error?: string }

const tabs: Array<{ id: PrescriberWorkspaceTab; label: string }> = [
  { id: 'decision', label: 'Decision' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'safety', label: 'Safety' },
  { id: 'products', label: 'Products' },
  { id: 'regimen', label: 'Regimen' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'history', label: 'History' },
]

const card = 'rounded-xl border border-white/10 bg-[#141922] p-4'
const subcard = 'rounded-lg border border-white/8 bg-white/[0.025] p-3'

function isResolvedJurisdiction(value: string): boolean {
  return /^[A-Z]{2}(?:-[A-Z0-9]{2,3})?$/.test(value) && value !== 'GLOBAL'
}

function StatePanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className={`${subcard} text-sm`} role="status">
      <p className="font-medium text-white/85">{title}</p>
      <p className="mt-1 leading-5 text-white/50">{detail}</p>
    </div>
  )
}

export default function ClinicalWorkspacePage({
  jurisdiction,
  roleLabel = '',
  initialQuery = '',
}: {
  jurisdiction: string
  roleLabel?: string
  initialQuery?: string
}) {
  const normalizedJurisdiction = jurisdiction.trim().toUpperCase()
  const contextResolved = isResolvedJurisdiction(normalizedJurisdiction)
  const [activeTab, setActiveTab] = useState<PrescriberWorkspaceTab>('decision')
  const [workspace, setWorkspace] = useState<ClinicalPrescriberWorkspaceDTO | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [answer, setAnswer] = useState<AskClinicalResponse | null>(null)
  const [answerLoading, setAnswerLoading] = useState(false)
  const [patients, setPatients] = useState<ClinicalPatientSummary[]>([])
  const [patientsState, setPatientsState] = useState<'idle' | 'loaded' | 'permission' | 'error'>('idle')

  useEffect(() => {
    setWorkspace(null)
    setWorkspaceError(null)
    setAnswer(null)
    setPatients([])
    setPatientsState('idle')
    setQuery(initialQuery)
    setActiveTab(initialQuery.trim().length >= 2 ? 'evidence' : 'decision')
    if (!contextResolved) return

    const controller = new AbortController()
    setWorkspaceLoading(true)
    void fetch(`/api/clinical/workspace?jurisdiction=${encodeURIComponent(normalizedJurisdiction)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as ClinicalPrescriberWorkspaceDTO | null
        if (!body) throw new Error(`Clinical workspace API ${response.status}`)
        setWorkspace(body)
        if (body.state === 'error') setWorkspaceError(body.diagnostics[0] ?? 'Clinical workspace source unavailable.')
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setWorkspaceError(error instanceof Error ? error.message : 'Clinical workspace source unavailable.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setWorkspaceLoading(false)
      })

    void fetch('/api/clinical/patients', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as PatientsResponse
        if (response.status === 401 || response.status === 403) {
          setPatientsState('permission')
          return
        }
        if (!response.ok) {
          setPatientsState('error')
          return
        }
        setPatients(Array.isArray(body.patients) ? body.patients : [])
        setPatientsState('loaded')
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setPatientsState('error')
      })

    return () => controller.abort()
  }, [contextResolved, normalizedJurisdiction, initialQuery])

  useEffect(() => {
    if (!contextResolved || initialQuery.trim().length < 2) return
    const controller = new AbortController()
    setAnswerLoading(true)
    const params = new URLSearchParams({ q: initialQuery.trim(), jurisdiction: normalizedJurisdiction, limit: '12' })
    void fetch(`/api/clinical/ask?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.json() as Promise<AskClinicalResponse>)
      .then(setAnswer)
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setAnswer({ state: 'error', question: initialQuery, answer: 'The governed evidence source is unavailable.', citations: [], unresolved: ['Retry before relying on this result.'] })
      })
      .finally(() => { if (!controller.signal.aborted) setAnswerLoading(false) })
    return () => controller.abort()
  }, [contextResolved, initialQuery, normalizedJurisdiction])

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = query.trim()
    if (!contextResolved || question.length < 2) return
    setAnswerLoading(true)
    setAnswer(null)
    try {
      const params = new URLSearchParams({ q: question, jurisdiction: normalizedJurisdiction, limit: '12' })
      const response = await fetch(`/api/clinical/ask?${params}`, { cache: 'no-store' })
      const body = await response.json() as AskClinicalResponse
      setAnswer(body)
    } catch {
      setAnswer({ state: 'error', question, answer: 'The governed evidence source is unavailable.', citations: [], unresolved: ['Retry before relying on this result.'] })
    } finally {
      setAnswerLoading(false)
    }
  }

  const relevantPatients = useMemo(
    () => patients.filter((patient) => patient.jurisdiction?.toUpperCase() === normalizedJurisdiction),
    [patients, normalizedJurisdiction],
  )

  if (!contextResolved) {
    return (
      <main className="min-h-screen bg-[#0c1016] px-4 py-6 text-white sm:px-6" data-testid="clinical-workspace-context-required">
        <div className="mx-auto max-w-6xl">
          <Link href="/dashboard?page=clinical" className="text-xs text-[#d4a853]">← Command Clinical</Link>
          <section className={`${card} mt-4`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Clinical workspace</p>
            <h1 className="mt-2 text-2xl font-semibold">Jurisdiction required</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Clinical does not infer or substitute a country. Return to Command Clinical and select a specific jurisdiction before opening the Prescriber Operating System.</p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0c1016] px-3 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 text-white sm:px-6 sm:pt-6" data-testid="clinical-workspace">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/dashboard?country=${encodeURIComponent(normalizedJurisdiction)}&page=clinical`} className="text-xs text-[#d4a853]">← Command Clinical</Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Clinical Workspace</h1>
            <p className="mt-1 text-sm text-white/50">{normalizedJurisdiction} · {roleLabel || 'Professional role unresolved'} · governed cannabinoid / medical-cannabis decision support</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/55">
            {workspaceLoading ? 'Loading governed sources…' : workspace ? `Workspace ${workspace.state}` : 'Workspace unavailable'}
          </div>
        </div>

        <nav className="sticky top-0 z-20 -mx-3 mt-4 overflow-x-auto border-y border-white/8 bg-[#0c1016]/95 px-3 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border" aria-label="Clinical workspace sections">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={activeTab === tab.id ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${activeTab === tab.id ? 'bg-[#d4a853]/16 text-[#e9c675]' : 'text-white/55 hover:bg-white/5 hover:text-white/80'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {workspaceError && <div className="mt-4 rounded-lg border border-red-400/25 bg-red-400/8 p-3 text-sm text-red-100/80" role="alert">{workspaceError}</div>}
        {workspace?.state === 'review-required' && <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/8 p-3 text-sm text-amber-100/80" role="status">Some Clinical records are withheld pending exact prescriber-inspectable provenance. Missing records are not treated as evidence of safety, efficacy or no interaction.</div>}

        <div className="mt-4 space-y-4">
          {activeTab === 'decision' && (
            <section className={card}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Decision</p>
              <h2 className="mt-2 text-lg font-semibold">Decision readiness</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatePanel title="Jurisdiction" detail={`${normalizedJurisdiction} is explicit. No cross-jurisdiction fallback is permitted.`} />
                <StatePanel title="Professional authority" detail={workspace?.authority.state === 'loaded' ? `Resolved for ${workspace.authority.professional?.role ?? 'verified clinician'}.` : workspace?.authority.notes ?? 'Authority is unresolved.'} />
                <StatePanel title="Patient context" detail={relevantPatients.length ? `${relevantPatients.length} care-team patient${relevantPatients.length === 1 ? '' : 's'} in this jurisdiction.` : patientsState === 'permission' ? 'Verified clinician access is required.' : 'No patient context selected.'} />
                <StatePanel title="Evidence posture" detail="No clinical answer is generated until an explicit question/context is submitted in Evidence." />
              </div>
              <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-sm leading-6 text-white/55">
                Use this workspace to inspect evidence, structured safety, products, regimen, monitoring and guidelines before recording a patient-specific decision through the existing consent-, authority- and RLS-gated clinical workflow.
              </div>
            </section>
          )}

          {activeTab === 'evidence' && (
            <section className={card} data-testid="clinical-workspace-evidence">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Evidence</p>
              <h2 className="mt-2 text-lg font-semibold">Ask governed Clinical evidence</h2>
              <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submitQuestion}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" aria-label="Clinical evidence question" placeholder="Enter a condition or clinical question" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#d4a853]/55" />
                <button type="submit" disabled={answerLoading || query.trim().length < 2} className="rounded-lg border border-[#d4a853]/35 bg-[#d4a853]/10 px-4 py-2.5 text-sm text-[#e8c36f] disabled:opacity-40">{answerLoading ? 'Retrieving…' : 'Retrieve evidence'}</button>
              </form>
              {!answer && !answerLoading && <StatePanel title="Awaiting explicit query" detail="No Top graded or other evidence answer is shown before a clinical query is submitted." />}
              {answer && (
                <div className="mt-4 space-y-3">
                  <div className={subcard}>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/40">{answer.state}</p>
                    <p className="mt-2 text-sm leading-6 text-white/75">{answer.answer}</p>
                    {answer.unresolved.map((item) => <p key={item} className="mt-2 text-xs text-amber-200/70">{item}</p>)}
                  </div>
                  {answer.citations.map((citation) => (
                    <article key={citation.evidenceRecordId} className={subcard}>
                      <h3 className="text-sm font-medium text-white/85">{citation.title}</h3>
                      <p className="mt-1 text-xs text-white/45">{citation.evidenceStrength} · {citation.conflictStatus} · verified {citation.verifiedAt.slice(0, 10)}</p>
                      <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Inspect primary source ↗</a>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'safety' && (
            <section className={card} data-testid="clinical-workspace-safety">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Safety</p>
              <h2 className="mt-2 text-lg font-semibold">Structured safety and interactions</h2>
              <p className="mt-1 text-sm text-white/50">Safety classification comes only from governed safety-rule and interaction fields; evidence prose is never regex-classified.</p>
              <div className="mt-4 space-y-3">
                {(workspace?.safety ?? []).map((item) => <article key={item.id} className={subcard}><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-medium text-white/85">{item.subject}</h3><span className="text-xs uppercase text-amber-200/70">{item.severity}</span></div><p className="mt-2 text-sm leading-6 text-white/60">{item.rationale}</p>{item.actionText && <p className="mt-2 text-xs text-white/50">Action: {item.actionText}</p>}<a href={item.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Source · {item.sourceLocator} ↗</a></article>)}
                {(workspace?.interactions ?? []).map((item) => <article key={item.id} className={subcard}><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-medium text-white/85">{item.medicationIngredient} × {item.cannabinoid}</h3><span className="text-xs uppercase text-amber-200/70">{item.clinicalSignificance}</span></div>{item.mechanism && <p className="mt-2 text-sm leading-6 text-white/60">{item.mechanism}</p>}{item.monitoringConsideration && <p className="mt-2 text-xs text-white/50">Monitor: {item.monitoringConsideration}</p>}<a href={item.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Inspect source{item.sourceLocator ? ` · ${item.sourceLocator}` : ''} ↗</a></article>)}
                {!workspaceLoading && (workspace?.safety.length ?? 0) === 0 && (workspace?.interactions.length ?? 0) === 0 && <StatePanel title={workspace?.interactionState === 'review-required' ? 'Safety data under provenance review' : 'No governed safety records loaded'} detail="An empty result is not interpreted as no risk. Review patient history and authoritative sources before action." />}
              </div>
            </section>
          )}

          {activeTab === 'products' && (
            <section className={card}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Products</p><h2 className="mt-2 text-lg font-semibold">Jurisdiction formulary</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{(workspace?.formulary ?? []).map((product) => <article key={product.id} className={subcard}><h3 className="text-sm font-medium text-white/85">{product.name}</h3><p className="mt-1 text-xs text-white/45">{product.authorizationStatus} · {product.cannabinoidProfile}</p><p className="mt-2 text-sm text-white/55">{product.notes}</p>{product.primarySourceUrl && <a href={product.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Source ↗</a>}</article>)}</div>
              {!workspaceLoading && (workspace?.formulary.length ?? 0) === 0 && <StatePanel title="No published formulary records" detail="The workspace does not substitute a product from another jurisdiction." />}
            </section>
          )}

          {activeTab === 'regimen' && (
            <section className={card}><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Regimen</p><h2 className="mt-2 text-lg font-semibold">Governed regimen protocols</h2><div className="mt-4 space-y-3">{(workspace?.regimens ?? []).map((item) => <article key={item.id} className={subcard}><h3 className="text-sm font-medium text-white/85">{item.indication}</h3>{item.population && <p className="mt-1 text-xs text-white/45">Population: {item.population}</p>}<pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-white/55">{JSON.stringify(item.regimenStructured, null, 2)}</pre><a href={item.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Source · {item.sourceLocator} ↗</a></article>)}{!workspaceLoading && (workspace?.regimens.length ?? 0) === 0 && <StatePanel title="No published regimen protocol" detail="No dose or titration plan is inferred from product or evidence metadata." />}</div></section>
          )}

          {activeTab === 'monitoring' && (
            <section className={card}><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Monitoring</p><h2 className="mt-2 text-lg font-semibold">Monitoring and stopping criteria</h2><div className="mt-4 space-y-3">{(workspace?.monitoring ?? []).map((item) => <article key={item.id} className={subcard}><h3 className="text-sm font-medium text-white/85">{item.protocolName}</h3><p className="mt-1 text-xs text-white/45">{item.context}{item.cannabinoid ? ` · ${item.cannabinoid}` : ''}</p>{item.baselineRequirements.length > 0 && <p className="mt-2 text-sm text-white/55">Baseline: {item.baselineRequirements.join(' · ')}</p>}{item.reassessmentSchedule.length > 0 && <p className="mt-1 text-sm text-white/55">Reassess: {item.reassessmentSchedule.join(' · ')}</p>}{item.stoppingRules.length > 0 && <p className="mt-1 text-sm text-white/55">Stopping: {item.stoppingRules.join(' · ')}</p>}<a href={item.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Source · {item.sourceLocator} ↗</a></article>)}{!workspaceLoading && (workspace?.monitoring.length ?? 0) === 0 && <StatePanel title="No inspectable monitoring protocol" detail="Legacy generic-source monitoring rows are withheld until exact source locators are reviewed." />}</div></section>
          )}

          {activeTab === 'guidelines' && (
            <section className={card}><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Guidelines</p><h2 className="mt-2 text-lg font-semibold">Current governed recommendations</h2><div className="mt-4 space-y-3">{(workspace?.guidelines ?? []).map((item) => <article key={item.id} className={subcard}><h3 className="text-sm font-medium text-white/85">{item.title}</h3><p className="mt-1 text-xs text-white/45">{item.authority}{item.recommendationStrength ? ` · ${item.recommendationStrength}` : ''}</p><p className="mt-2 text-sm leading-6 text-white/60">{item.recommendationText}</p><a href={item.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#d4a853]">Source · {item.sourceLocator} ↗</a></article>)}{!workspaceLoading && (workspace?.guidelines.length ?? 0) === 0 && <StatePanel title="No current governed guideline projection" detail="The workspace does not synthesize recommendations from search results or regulator homepages." />}</div></section>
          )}

          {activeTab === 'documentation' && (
            <section className={card}><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Documentation</p><h2 className="mt-2 text-lg font-semibold">Patient and consent-bound workflow</h2><p className="mt-1 text-sm leading-6 text-white/50">Documentation continues to use the existing patient, consent, verified-clinician, professional-authority and RLS contracts. This workspace does not bypass those gates.</p><div className="mt-4 space-y-3">{patientsState === 'permission' && <StatePanel title="Verified clinician access required" detail="Patient records and documentation are not exposed without the existing Clinical authorization contract." />}{patientsState === 'error' && <StatePanel title="Patient source unavailable" detail="Clinical documentation remains fail-closed." />}{patientsState === 'loaded' && relevantPatients.map((patient) => <article key={patient.id} className={subcard}><h3 className="text-sm font-medium text-white/85">{patient.family_name}, {patient.given_name}</h3><p className="mt-1 text-xs text-white/45">{patient.jurisdiction} · {patient.status ?? 'status unavailable'} · {patient.id.slice(0, 8)}</p></article>)}{patientsState === 'loaded' && relevantPatients.length === 0 && <StatePanel title="No care-team patient in this jurisdiction" detail="Create or open a patient only through the existing consent-gated Clinical patient workflow." />}</div></section>
          )}

          {activeTab === 'history' && (
            <section className={card}><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">History</p><h2 className="mt-2 text-lg font-semibold">Longitudinal clinical history</h2><p className="mt-1 text-sm leading-6 text-white/50">History is patient-scoped. The Prescriber OS domain adds longitudinal decision/change-impact records, while existing encounter, recommendation, prescription, calculation and audit history remain authoritative.</p>{relevantPatients.length === 0 ? <div className="mt-4"><StatePanel title="Select patient context first" detail="No cross-patient history is aggregated into a generic Clinical deck." /></div> : <div className="mt-4 space-y-3">{relevantPatients.map((patient) => <article key={patient.id} className={subcard}><h3 className="text-sm font-medium text-white/85">{patient.family_name}, {patient.given_name}</h3><p className="mt-1 text-xs text-white/45">Patient-scoped history remains protected by care-team RLS and active consent.</p></article>)}</div>}</section>
          )}
        </div>
      </div>
    </main>
  )
}
