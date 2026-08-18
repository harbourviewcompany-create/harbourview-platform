'use client'

import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { getAttentionItems } from '@/lib/fixtures/clinical/jurisdictions'
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

type FormularySku = {
  id: string
  countryIso2: string
  authority: string
  registrationCode: string | null
  brandName: string | null
  productName: string
  strengthLabel: string | null
  dosageForm: string | null
  route: string | null
  cannabinoidProfile: string | null
  authorizationStatus: string
  sourceUrl: string | null
  sourceType: string
  notes: string
  lastSeenAt: string
}

type JurisdictionProfile = {
  country: string
  iso2: string
  status: string
  legalPathway: string
  summary: string
  primaryAuthority: { name: string; role: string; url?: string }
  professionalRegulator?: { name: string; role: string; url?: string }
  keyRules: string[]
  accessNotes: string
  lastReviewed: string
  pathway: {
    roles: string
    whoMayPrescribe: string
    restrictions: string[]
    notes: string
    lastReviewed: string
  } | null
}

type WorkspaceSafetyRow = {
  id: string
  kind: string
  subject: string
  severity: string
  rationale: string
  actionText: string | null
  primarySourceUrl: string
  sourceLocator: string | null
}

type WorkspaceRegimenRow = {
  id: string
  formularyProductId: string | null
  formularySkuId: string | null
  jurisdiction: string
  population: string | null
  indication: string
  regimenStructured: Record<string, unknown>
  titrationStructured: Record<string, unknown>
  administrationInstructions: string[]
  monitoringRequirements: string[]
  stoppingRules: string[]
  primarySourceUrl: string
  sourceLocator: string | null
  sourceVersion: string | null
}

type WorkspaceMonitoringRow = {
  id: string
  formularyProductId: string | null
  formularySkuId: string | null
  jurisdiction: string | null
  baselineRequirements: string[]
  therapeuticObjectives: string[]
  efficacyMeasures: string[]
  safetyMeasures: string[]
  laboratoryMonitoring: string[]
  reassessmentSchedule: string[]
  stoppingRules: string[]
  primarySourceUrl: string
  sourceLocator: string | null
}

type WorkspaceGuidelineRow = {
  id: string
  jurisdiction: string
  authority: string
  title: string
  recommendationText: string
  recommendationStrength: string | null
  population: string | null
  intervention: string | null
  outcome: string | null
  effectiveDate: string | null
  primarySourceUrl: string
  sourceLocator: string | null
}

type WorkspaceEnvelope = {
  state: 'loaded' | 'empty' | 'permission' | 'error'
  safety: WorkspaceSafetyRow[]
  regimens: WorkspaceRegimenRow[]
  monitoring: WorkspaceMonitoringRow[]
  guidelines: WorkspaceGuidelineRow[]
  error?: string
}

type EvidenceEnvelope = {
  state?: string
  message?: string
  records?: ClinicalEvidenceRecordDTO[]
  changes?: ClinicalEvidenceChangeEventDTO[]
}

type ProfessionalAuthority = {
  state: 'loaded' | 'unknown' | 'permission' | 'error'
  verifiedClinician: boolean
  professional: {
    id: string
    fullName: string
    role: string | null
    licenceNumber: string | null
    licenceJurisdiction: string | null
    verificationStatus: string | null
  } | null
  jurisdiction: string
  capabilities: {
    recommend: boolean | null
    prescribe: boolean | null
    dispense: boolean | null
    claimAppropriateness: boolean | null
  }
  evidenceVersion: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  notes: string | null
  error?: string
}

type ClinicalPatientRow = {
  id: string
  jurisdiction: string
  status: string
  given_name: string
  family_name: string
  date_of_birth: string | null
  external_mrn: string | null
}

type PatientReadiness = {
  state: 'loaded' | 'permission' | 'error'
  patient?: { id: string; jurisdiction: string; status: string }
  consent?: { treatment: boolean; dataProcessing: boolean; core: boolean }
  openEncounter?: {
    id: string
    started_at: string
    jurisdiction: string
    encounter_type: string
    status: string
  } | null
  error?: string
}

type AdverseEventRow = {
  id: string
  created_at: string
  suspected_product_name: string
  event_summary: string
  seriousness: string
  authority_report_status: string
  status: string
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
  const good = ['loaded', 'ready', 'current', 'published', 'active'].includes(normalized)
  const warn = ['stale', 'conflicting', 'conflicted', 'material-conflict', 'review-required', 'under-review', 'attention', 'moderate', 'major', 'unknown'].includes(normalized)
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

function StringList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null
  return <div className="mt-2"><p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</p><ul className="mt-1 space-y-1 text-xs text-white/65">{values.map((value) => <li key={value}>• {value}</li>)}</ul></div>
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
  const [skus, setSkus] = useState<FormularySku[]>([])
  const [selectedSkuId, setSelectedSkuId] = useState('')
  const [interactions, setInteractions] = useState<InteractionRow[]>([])
  const [modules, setModules] = useState<EducationModule[]>([])
  const [jurisdiction, setJurisdiction] = useState<JurisdictionProfile | null>(null)
  const [jurisdictionState, setJurisdictionState] = useState<'loading' | 'loaded' | 'empty' | 'error'>('loading')
  const [workspaceData, setWorkspaceData] = useState<WorkspaceEnvelope>({ state: 'empty', safety: [], regimens: [], monitoring: [], guidelines: [] })
  const [authority, setAuthority] = useState<ProfessionalAuthority | null>(null)
  const [authorityState, setAuthorityState] = useState<'loading' | 'loaded' | 'unknown' | 'permission' | 'error'>('loading')
  const [patients, setPatients] = useState<ClinicalPatientRow[]>([])
  const [patientState, setPatientState] = useState<'loading' | 'loaded' | 'empty' | 'permission' | 'error'>('loading')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientReadiness, setPatientReadiness] = useState<PatientReadiness | null>(null)
  const [adverseEvents, setAdverseEvents] = useState<AdverseEventRow[]>([])
  const [adverseProduct, setAdverseProduct] = useState('')
  const [adverseSummary, setAdverseSummary] = useState('')
  const [adverseSeriousness, setAdverseSeriousness] = useState<'serious' | 'non-serious' | 'unknown'>('unknown')
  const [operationMessage, setOperationMessage] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  const inspectableSkus = useMemo(
    () => skus.filter((sku) => isInspectableClinicalSource(sku.sourceUrl)),
    [skus],
  )

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  )

  const selectedSku = useMemo(
    () => inspectableSkus.find((sku) => sku.id === selectedSkuId) ?? null,
    [inspectableSkus, selectedSkuId],
  )

  const applicableRegimens = useMemo(
    () => selectedSkuId ? workspaceData.regimens.filter((row) => row.formularySkuId === selectedSkuId) : workspaceData.regimens,
    [selectedSkuId, workspaceData.regimens],
  )

  const applicableMonitoring = useMemo(
    () => selectedSkuId
      ? workspaceData.monitoring.filter((row) => !row.formularySkuId || row.formularySkuId === selectedSkuId)
      : workspaceData.monitoring,
    [selectedSkuId, workspaceData.monitoring],
  )

  const sourceBlockedCount =
    (records.length - inspectableEvidence.length) +
    (interactions.length - inspectableInteractions.length) +
    (skus.length - inspectableSkus.length)

  const readiness = useMemo(() => derivePrescriberReadiness({
    hasClinicalContext: Boolean(patientReadiness?.state === 'loaded' && patientReadiness.openEncounter),
    hasInspectableEvidence: inspectableEvidence.length > 0,
    authorityKnown: authority?.state === 'loaded',
    authorityAllowsAction: authority?.capabilities.prescribe === true,
    productResolved: Boolean(selectedSku),
    unresolvedMajorSafetyItems:
      inspectableInteractions.filter((row) => row.clinicalSignificance === 'major').length +
      workspaceData.safety.filter((row) => row.severity === 'major' || row.severity === 'contraindicated').length,
    monitoringDefined: Boolean(selectedSku && applicableMonitoring.length > 0),
    consentConfirmed: patientReadiness?.consent?.core === true,
  }), [authority, patientReadiness, inspectableEvidence, inspectableInteractions, selectedSku, applicableMonitoring.length, workspaceData.safety])

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
    const body = await response.json().catch(() => ({})) as { products?: FormularyProductDTO[]; skus?: FormularySku[] }
    setFormulary(Array.isArray(body.products) ? body.products : [])
    setSkus(Array.isArray(body.skus) ? body.skus : [])
  }, [iso2])

  const loadJurisdiction = useCallback(async () => {
    const response = await fetch(`/api/clinical/jurisdiction?country=${encodeURIComponent(iso2)}`)
    const body = await response.json().catch(() => ({})) as { state?: string; profile?: JurisdictionProfile | null }
    setJurisdictionState(response.ok && body.profile ? 'loaded' : response.ok ? 'empty' : 'error')
    setJurisdiction(body.profile ?? null)
  }, [iso2])

  const loadWorkspace = useCallback(async () => {
    const response = await fetch(`/api/clinical/workspace?country=${encodeURIComponent(iso2)}`)
    const body = await response.json().catch(() => null) as WorkspaceEnvelope | null
    if (body) setWorkspaceData(body)
    else setWorkspaceData({ state: response.status === 403 ? 'permission' : 'error', safety: [], regimens: [], monitoring: [], guidelines: [], error: `Workspace API ${response.status}` })
  }, [iso2])

  const loadAuthority = useCallback(async () => {
    try {
      const response = await fetch(`/api/clinical/authority?country=${encodeURIComponent(iso2)}`)
      const body = await response.json().catch(() => null) as ProfessionalAuthority | null
      if (body?.state) {
        setAuthority(body)
        setAuthorityState(body.state)
        return
      }
      setAuthority(null)
      setAuthorityState(response.status === 403 ? 'permission' : 'error')
    } catch {
      setAuthority(null)
      setAuthorityState('error')
    }
  }, [iso2])

  const loadPatients = useCallback(async () => {
    try {
      const response = await fetch('/api/clinical/patients')
      const body = await response.json().catch(() => ({})) as { patients?: ClinicalPatientRow[] }
      if (!response.ok) {
        setPatients([])
        setPatientState(response.status === 401 || response.status === 403 ? 'permission' : 'error')
        return
      }
      const list = Array.isArray(body.patients) ? body.patients : []
      setPatients(list)
      setPatientState(list.length ? 'loaded' : 'empty')
    } catch {
      setPatients([])
      setPatientState('error')
    }
  }, [])

  const loadPatientContext = useCallback(async (patientId: string) => {
    if (!patientId) {
      setPatientReadiness(null)
      setAdverseEvents([])
      return
    }
    setOperationError(null)
    const [readinessResponse, adverseResponse] = await Promise.all([
      fetch(`/api/clinical/patients/${encodeURIComponent(patientId)}/readiness`),
      fetch(`/api/clinical/adverse-events?patient_id=${encodeURIComponent(patientId)}&limit=20`),
    ])
    const readinessBody = await readinessResponse.json().catch(() => null) as PatientReadiness | null
    setPatientReadiness(readinessBody ?? {
      state: readinessResponse.status === 401 || readinessResponse.status === 403 ? 'permission' : 'error',
      error: `Patient readiness API ${readinessResponse.status}`,
    })
    const adverseBody = await adverseResponse.json().catch(() => ({})) as { adverseEvents?: AdverseEventRow[] }
    setAdverseEvents(adverseResponse.ok && Array.isArray(adverseBody.adverseEvents) ? adverseBody.adverseEvents : [])
  }, [])

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
      void loadJurisdiction()
      void loadWorkspace()
      void loadAuthority()
      void loadPatients()
    })
  }, [loadAuthority, loadEducation, loadEvidence, loadFormulary, loadInteractions, loadJurisdiction, loadPatients, loadWorkspace])

  useEffect(() => {
    void loadPatientContext(selectedPatientId)
  }, [loadPatientContext, selectedPatientId])

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

  async function recordAdverseEvent() {
    if (!selectedPatient || !patientReadiness?.consent?.core || !adverseProduct.trim() || adverseSummary.trim().length < 4) return
    setOperationError(null)
    setOperationMessage(null)
    const response = await fetch('/api/clinical/adverse-events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        patient_id: selectedPatient.id,
        encounter_id: patientReadiness.openEncounter?.id ?? null,
        jurisdiction: selectedPatient.jurisdiction,
        formulary_sku_id: selectedSkuId || null,
        suspected_product_name: adverseProduct.trim(),
        event_summary: adverseSummary.trim(),
        seriousness: adverseSeriousness,
      }),
    })
    const body = await response.json().catch(() => ({})) as { error?: string; reportingBoundary?: string }
    if (!response.ok) {
      setOperationError(body.error ?? `Adverse event API ${response.status}`)
      return
    }
    setAdverseProduct('')
    setAdverseSummary('')
    setAdverseSeriousness('unknown')
    setOperationMessage(body.reportingBoundary ?? 'Adverse event recorded.')
    await loadPatientContext(selectedPatient.id)
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
            ['safety', inspectableInteractions.length + workspaceData.safety.length, 'Safety records'],
            ['products', inspectableSkus.length || inspectableProducts.length, 'Inspectable products'],
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
          <StateBadge state={jurisdictionState} />
          <StateBadge state={authorityState} />
          {workspaceData.state !== 'loaded' && <StateBadge state={workspaceData.state} />}
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

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-lg bg-white/[.03] p-3">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-white/85">Professional authority</p><StateBadge state={authorityState} /></div>
                  {authority?.professional ? (
                    <p className={`mt-2 text-xs ${muted}`}>{authority.professional.fullName} · {authority.professional.role || 'role unresolved'} · {authority.professional.licenceJurisdiction || 'licence jurisdiction unresolved'}</p>
                  ) : <p className={`mt-2 text-xs ${muted}`}>Verified clinician identity and governed jurisdiction authority are required.</p>}
                  {authority?.state === 'loaded' && (
                    <p className={`mt-2 text-xs ${muted}`}>Prescribe {authority.capabilities.prescribe ? 'allowed' : 'not allowed'} · recommend {authority.capabilities.recommend ? 'allowed' : 'not allowed'} · evidence {authority.evidenceVersion || 'version not recorded'}</p>
                  )}
                </div>

                <div className="rounded-lg bg-white/[.03] p-3">
                  <div className="flex items-start justify-between gap-2"><label htmlFor="clinical-patient-context" className="text-sm font-medium text-white/85">Patient / encounter context</label><StateBadge state={selectedPatientId ? patientReadiness?.state || 'loading' : patientState} /></div>
                  <select id="clinical-patient-context" value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#11161d] px-3 py-2 text-sm text-white">
                    <option value="">No patient selected</option>
                    {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.given_name} {patient.family_name} · {patient.jurisdiction}</option>)}
                  </select>
                  {patientReadiness?.state === 'loaded' && <p className={`mt-2 text-xs ${muted}`}>Core consent {patientReadiness.consent?.core ? 'active' : 'incomplete'} · {patientReadiness.openEncounter ? `open ${patientReadiness.openEncounter.encounter_type} encounter` : 'no open encounter'}</p>}
                  {patientState === 'permission' && <p className="mt-2 text-xs text-amber-300">Verified clinician access is required to load patient context.</p>}
                </div>

                <div className="rounded-lg bg-white/[.03] p-3">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-white/85">Resolved product</p><StateBadge state={selectedSku ? 'ready' : 'review-required'} /></div>
                  <p className={`mt-2 text-xs ${muted}`}>{selectedSku ? `${selectedSku.brandName || selectedSku.productName} · ${selectedSku.strengthLabel || 'strength not loaded'}` : 'Select an inspectable exact SKU in Products before product-specific readiness can clear.'}</p>
                  <button type="button" onClick={() => openWorkspace('products')} className="mt-2 text-xs font-semibold text-[#d4a853]">Open Products →</button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {readiness.dimensions.map((dimension) => (
                  <div key={dimension.key} className="flex items-start justify-between gap-3 rounded-lg bg-white/[.03] p-3">
                    <div><p className="text-sm font-medium text-white/85">{dimension.label}</p><p className={`mt-1 text-xs ${muted}`}>{dimension.explanation}</p></div>
                    <StateBadge state={dimension.state} />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-amber-300">Overall: {readiness.state.replace(/-/g, ' ')}. Patient-specific action remains blocked until patient, open encounter, core consent, professional authority, product, safety and monitoring requirements are resolved.</p>
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
                    <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-white/90">{record.title}</h3><StateBadge state={record.conflictStatus === 'material-conflict' ? 'conflicting' : record.evidenceStrength} /></div>
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
              <p className={`text-sm ${muted}`}>Absence of a governed row never means absence of a contraindication or interaction.</p>
              <div className="mt-4 space-y-2">
                {workspaceData.safety.map((row) => (
                  <div key={row.id} className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white/85">{row.subject}</p><p className={`mt-1 text-xs ${muted}`}>{row.kind}</p></div><StateBadge state={row.severity} /></div>
                    <p className={`mt-2 text-xs ${muted}`}>{row.rationale}</p>
                    {row.actionText && <p className="mt-2 text-xs text-amber-300">{row.actionText}</p>}
                    <p className="mt-2 text-xs"><SourceLink url={row.primarySourceUrl}>Inspect safety source ↗</SourceLink></p>
                  </div>
                ))}
                {inspectableInteractions.map((row) => (
                  <div key={row.id} className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/85">{row.medicationIngredient} × {row.cannabinoid}</p><StateBadge state={row.clinicalSignificance} /></div>
                    {row.mechanism && <p className={`mt-1 text-xs ${muted}`}>{row.mechanism}</p>}
                    {row.monitoringConsideration && <p className="mt-2 text-xs text-amber-300">{row.monitoringConsideration}</p>}
                    <p className={`mt-2 text-xs ${muted}`}>Certainty: {row.evidenceCertainty} · <SourceLink url={row.primarySourceUrl}>{row.primarySourceTitle} ↗</SourceLink></p>
                  </div>
                ))}
                {workspaceData.safety.length === 0 && inspectableInteractions.length === 0 && <EmptyState title="No prescriber-inspectable safety rows loaded" body="Contraindication, interaction and special-population material remains review-gated until source-specific records are available." />}
              </div>

              <div className="mt-5 border-t border-white/8 pt-4">
                <div className="flex items-start justify-between gap-3"><div><SectionLabel>Pharmacovigilance</SectionLabel><p className={`text-sm ${muted}`}>Clinician-authored adverse-event record only. Harbourview does not infer reporting obligations or submit regulator reports.</p></div><StateBadge state={selectedPatient ? patientReadiness?.state || 'loading' : 'review-required'} /></div>
                {selectedPatient && patientReadiness?.consent?.core ? (
                  <>
                    <form className="mt-3 grid gap-2" onSubmit={(event) => { event.preventDefault(); void recordAdverseEvent() }}>
                      <input value={adverseProduct} onChange={(event) => setAdverseProduct(event.target.value)} placeholder="Suspected product" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35" />
                      <textarea value={adverseSummary} onChange={(event) => setAdverseSummary(event.target.value)} placeholder="Clinician-authored event summary" rows={3} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35" />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select value={adverseSeriousness} onChange={(event) => setAdverseSeriousness(event.target.value as 'serious' | 'non-serious' | 'unknown')} className="rounded-lg border border-white/10 bg-[#11161d] px-3 py-2 text-sm text-white">
                          <option value="unknown">Seriousness not assessed</option>
                          <option value="non-serious">Non-serious</option>
                          <option value="serious">Serious</option>
                        </select>
                        <button type="submit" disabled={!adverseProduct.trim() || adverseSummary.trim().length < 4} className="rounded-lg bg-[#d4a853]/20 px-4 py-2 text-sm font-semibold text-[#d4a853] disabled:opacity-40">Record adverse event</button>
                      </div>
                    </form>
                    {operationError && <p className="mt-2 text-xs text-red-300">{operationError}</p>}
                    {operationMessage && <p className="mt-2 text-xs text-emerald-300">{operationMessage}</p>}
                    <div className="mt-3 space-y-2">
                      {adverseEvents.map((event) => <div key={event.id} className="rounded-lg bg-white/[.025] p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/85">{event.suspected_product_name}</p><StateBadge state={event.seriousness} /></div><p className={`mt-1 text-xs ${muted}`}>{event.event_summary}</p><p className={`mt-2 text-xs ${muted}`}>{event.created_at.slice(0, 10)} · record {event.status} · external report {event.authority_report_status}</p></div>)}
                      {adverseEvents.length === 0 && <p className={`text-xs ${muted}`}>No adverse-event record is loaded for the selected patient.</p>}
                    </div>
                  </>
                ) : <EmptyState title="Select an eligible patient context" body="Recording stays unavailable until the verified clinician can access a patient with active treatment and data-processing consent." />}
              </div>
            </section>
          )}

          {activeTab === 'products' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Products & formulary · {countryLabel}</SectionLabel>
              <p className={`text-sm ${muted}`}>Exact SKUs, class/pathway records and efficacy evidence remain separate. A catalog row is not itself a regimen or indication claim.</p>
              <div className="mt-4 space-y-2">
                {skus.map((sku) => (
                  <div key={sku.id} className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white/90">{sku.brandName || sku.productName}</p><p className={`mt-1 text-xs ${muted}`}>{sku.authority} · {sku.authorizationStatus} · {sku.route || 'route not loaded'}</p></div><StateBadge state={selectedSkuId === sku.id ? 'ready' : isInspectableClinicalSource(sku.sourceUrl) ? 'published' : 'review-required'} /></div>
                    <p className={`mt-2 text-xs ${muted}`}>{[sku.registrationCode && `Registration ${sku.registrationCode}`, sku.strengthLabel, sku.cannabinoidProfile].filter(Boolean).join(' · ') || 'Product metadata incomplete'}</p>
                    {sku.notes && <p className={`mt-2 text-xs ${muted}`}>{sku.notes}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><SourceLink url={sku.sourceUrl}>Inspect product authority ↗</SourceLink>{isInspectableClinicalSource(sku.sourceUrl) && <button type="button" onClick={() => setSelectedSkuId(selectedSkuId === sku.id ? '' : sku.id)} className="font-semibold text-[#d4a853]">{selectedSkuId === sku.id ? 'Clear decision product' : 'Use in decision'}</button>}</div>
                  </div>
                ))}
                {formulary.map((product) => (
                  <div key={product.id} className="rounded-lg bg-white/[.025] p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white/85">{product.brandName || product.name}</p><p className={`mt-1 text-xs ${muted}`}>Class/pathway · {product.productClass} · {product.authorizationStatus}</p></div><StateBadge state={isInspectableClinicalSource(product.primarySourceUrl) ? product.reviewStatus : 'review-required'} /></div>
                    <p className={`mt-2 text-xs ${muted}`}>{product.notes}</p>
                    <p className="mt-2 text-xs"><SourceLink url={product.primarySourceUrl}>Inspect class authority ↗</SourceLink></p>
                  </div>
                ))}
                {skus.length === 0 && formulary.length === 0 && <EmptyState title="No reviewed formulary rows loaded" body="No governed product or class record is available for this jurisdiction." />}
              </div>
            </section>
          )}

          {activeTab === 'regimen' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Product-specific regimen</SectionLabel>
              <p className={`text-sm ${muted}`}>Only published, source-versioned product/indication/population/jurisdiction protocols are shown. The legacy generic mg/kg helper is excluded.</p>
              {selectedSku && <p className="mt-2 text-xs text-[#d4a853]">Decision product: {selectedSku.brandName || selectedSku.productName}</p>}
              <div className="mt-4 space-y-2">
                {applicableRegimens.map((row) => (
                  <div key={row.id} className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white/90">{row.indication}</p><p className={`mt-1 text-xs ${muted}`}>{row.population || 'population not specified'} · {row.formularySkuId ? 'exact SKU' : 'formulary product/class'}</p></div><StateBadge state="published" /></div>
                    <StringList label="Administration" values={row.administrationInstructions} />
                    <StringList label="Monitoring" values={row.monitoringRequirements} />
                    <StringList label="Stop criteria" values={row.stoppingRules} />
                    <p className="mt-3 text-xs"><SourceLink url={row.primarySourceUrl}>Inspect regimen source ↗</SourceLink>{row.sourceVersion ? <span className="ml-2 text-white/45">Version {row.sourceVersion}</span> : null}</p>
                  </div>
                ))}
                {applicableRegimens.length === 0 && <EmptyState title="No reviewed product/indication regimen loaded" body={selectedSku ? 'No published regimen protocol matches the selected exact SKU. The product remains unresolved for regimen use.' : 'A regimen becomes prescriber-visible only after a governed product or exact SKU, indication, population, jurisdiction, source version and professional review are linked.'} />}
              </div>
              <p className="mt-3 text-xs text-white/45">Legacy calculation records/APIs remain preserved for compatibility; they are not promoted as prescribing guidance.</p>
            </section>
          )}

          {activeTab === 'monitoring' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Monitoring & therapeutic objectives</SectionLabel>
              <div className="space-y-2">
                {applicableMonitoring.map((row) => (
                  <div key={row.id} className="rounded-lg bg-white/[.03] p-3">
                    <StringList label="Baseline" values={row.baselineRequirements} />
                    <StringList label="Therapeutic objectives" values={row.therapeuticObjectives} />
                    <StringList label="Effectiveness" values={row.efficacyMeasures} />
                    <StringList label="Safety" values={row.safetyMeasures} />
                    <StringList label="Laboratory" values={row.laboratoryMonitoring} />
                    <StringList label="Reassessment" values={row.reassessmentSchedule} />
                    <StringList label="Stop criteria" values={row.stoppingRules} />
                    <p className="mt-3 text-xs"><SourceLink url={row.primarySourceUrl}>Inspect monitoring source ↗</SourceLink></p>
                  </div>
                ))}
                {applicableMonitoring.length === 0 && <EmptyState title="No reviewed monitoring protocol loaded" body="Baseline, objectives, effectiveness/safety measures, reassessment and stopping rules remain unavailable until a source-backed protocol matching the selected decision context is reviewed." />}
              </div>
              <p className="mt-3 text-xs text-amber-300">Patient-specific monitoring remains blocked until a verified patient/encounter, core consent, governed authority and decision product are loaded.</p>
            </section>
          )}

          {activeTab === 'guidelines' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Guidelines & professional pathway</SectionLabel>
              {jurisdiction ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/90">{jurisdiction.country}</p><StateBadge state={jurisdiction.status} /></div>
                    <p className={`mt-1 text-xs ${muted}`}>{jurisdiction.summary}</p>
                    <p className={`mt-2 text-xs ${muted}`}>{jurisdiction.legalPathway}</p>
                    <p className="mt-2 text-xs"><SourceLink url={jurisdiction.primaryAuthority.url}>{jurisdiction.primaryAuthority.name} ↗</SourceLink></p>
                    <StringList label="Current scoped rules" values={jurisdiction.keyRules} />
                  </div>
                  {jurisdiction.pathway && <div className="rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/90">Professional pathway</p><p className={`mt-1 text-xs ${muted}`}>{jurisdiction.pathway.whoMayPrescribe}</p><p className={`mt-2 text-xs ${muted}`}>Scope: {jurisdiction.pathway.roles} · reviewed {jurisdiction.pathway.lastReviewed}</p><StringList label="Restrictions" values={jurisdiction.pathway.restrictions} /></div>}
                  <div className="rounded-lg bg-white/[.03] p-3">
                    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/90">Your governed authority</p><StateBadge state={authorityState} /></div>
                    <p className={`mt-1 text-xs ${muted}`}>{authority?.state === 'loaded' ? `${authority.professional?.role || 'role unresolved'} · prescribe ${authority.capabilities.prescribe ? 'allowed' : 'not allowed'} · recommend ${authority.capabilities.recommend ? 'allowed' : 'not allowed'}` : authority?.notes || 'No current governed authority resolution is available for this user and jurisdiction.'}</p>
                  </div>
                </div>
              ) : <EmptyState title="No reviewed jurisdiction profile loaded" body="Professional authority is not inferred when the DB-backed jurisdiction record is empty or unavailable." />}
              <div className="mt-4 space-y-2">
                {workspaceData.guidelines.map((row) => <div key={row.id} className="rounded-lg bg-white/[.03] p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/90">{row.title}</p><StateBadge state="current" /></div><p className={`mt-1 text-xs ${muted}`}>{row.authority}{row.recommendationStrength ? ` · ${row.recommendationStrength}` : ''}</p><p className={`mt-2 text-sm leading-relaxed ${muted}`}>{row.recommendationText}</p><p className="mt-2 text-xs"><SourceLink url={row.primarySourceUrl}>Inspect guideline source ↗</SourceLink></p></div>)}
              </div>
              <p className="mt-4 text-xs text-white/45">Guideline recommendations remain independently versioned from evidence claims so conflicts and supersession are inspectable.</p>
            </section>
          )}

          {activeTab === 'documentation' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Documentation & shared decision</SectionLabel>
              <p className={`text-sm ${muted}`}>Existing verified-clinician, patient, care-team, consent, recommendation and prescription contracts remain authoritative. New decision records store clinician-authored rationale plus evidence-claim, product/SKU, guideline and unresolved-safety references.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/85">Current decision context</p><p className={`mt-1 text-xs ${muted}`}>{selectedPatient ? `${selectedPatient.given_name} ${selectedPatient.family_name} · ${selectedPatient.jurisdiction}` : 'No patient selected'} · {selectedSku ? selectedSku.brandName || selectedSku.productName : 'no exact SKU selected'}</p><p className={`mt-2 text-xs ${muted}`}>{patientReadiness?.consent?.core ? 'Core consent active' : 'Core consent unresolved'} · {patientReadiness?.openEncounter ? 'Open encounter loaded' : 'Open encounter unresolved'} · authority {authorityState}</p></div>
                <div className="rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/85">Shared-decision boundary</p><p className={`mt-1 text-xs ${muted}`}>The schema can retain clinician-authored rationale and the consent record references used for shared decision-making. No consent is created automatically from this workspace.</p></div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href="/network/clinical-education" className="rounded-lg bg-white/[.04] p-3 text-sm font-medium text-[#d4a853]">Professional education →</Link><Link href="/network/clinical-education/request" className="rounded-lg bg-white/[.04] p-3 text-sm font-medium text-[#d4a853]">Request clinical education support →</Link></div>
              <p className="mt-3 text-xs text-white/45">Patient writes remain unavailable until the verified patient/encounter, consent and authority gates are satisfied; existing recommendation and prescription APIs remain the authoritative write paths.</p>
            </section>
          )}

          {activeTab === 'history' && (
            <section className={`${card} p-4`}>
              <SectionLabel>Clinical change history</SectionLabel>
              <div className="space-y-2">
                {changes.length === 0 && <EmptyState title="No reviewed material-change event loaded" body="This means no governed change event is available here; it does not mean nothing changed externally." />}
                {changes.map((change) => <div key={change.id} className="rounded-lg bg-white/[.03] p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-white/90">{change.title}</p><StateBadge state={change.materiality} /></div><p className={`mt-1 text-xs ${muted}`}>{change.summary}</p><p className={`mt-2 text-xs ${muted}`}>{change.occurredAt.slice(0, 10)} · <SourceLink url={change.primarySource.url}>{change.primarySource.title} ↗</SourceLink></p></div>)}
              </div>
              <p className="mt-4 text-xs text-white/45">Patient-impact review is schema-backed so reviewed change events can be matched for clinician review without automatically changing treatment.</p>
            </section>
          )}

          {modules.length > 0 && <section className={`${card} p-4`}><SectionLabel>Contextual professional education</SectionLabel><div className="flex gap-2 overflow-x-auto pb-1">{modules.slice(0, 6).map((module) => <Link key={module.id} href={module.route || `/network/clinical-education/${module.slug}`} className="min-w-[220px] rounded-lg bg-white/[.03] p-3"><p className="text-sm font-medium text-white/85">{module.title}</p><p className={`mt-1 text-xs ${muted}`}>{module.moduleStatus || 'Review state unavailable'}</p></Link>)}</div></section>}
        </>
      )}
    </div>
  )
}
