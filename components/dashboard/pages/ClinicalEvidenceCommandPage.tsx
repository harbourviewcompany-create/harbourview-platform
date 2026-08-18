/**
 * Clinical Evidence Command — production data paths
 * Evidence: GET /api/clinical/evidence → { state, records, message }
 * Formulary: GET /api/clinical/formulary
 * Education: GET /api/clinical/education
 * Interactions: GET /api/clinical/interactions
 */
'use client'

import React, { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  getAttentionItems,
  getNextActions,
} from '@/lib/fixtures/clinical/jurisdictions'
import {
  computeWeightBasedCannabinoidDose,
  DOSING_ALGORITHM_VERSION,
  CAUTION_MG_PER_KG_PER_DAY,
} from '@/lib/clinical/dosing'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'
import type { ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'

export type ClinicalEvidenceCommandPageProps = {
  countryLabel: string
  countryIso2?: string | null
  roleLabel?: string
}

type EduModule = {
  id: string
  slug: string
  title: string
  route?: string
  moduleStatus?: string
  riskLevel?: string
  publicSummary?: string
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

const card = 'bg-[#161b22] border border-white/8 rounded-xl'
const muted = 'text-white/55'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]/80">
      {children}
    </div>
  )
}

function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'ready' | 'loaded' | 'empty' | 'attention' | 'neutral'
}) {
  const tones = {
    ready: 'bg-emerald-500/15 text-emerald-400',
    loaded: 'bg-[#d4a853]/15 text-[#d4a853]',
    empty: 'bg-white/8 text-white/50',
    attention: 'bg-amber-500/15 text-amber-400',
    neutral: 'bg-white/8 text-white/60',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}>
      {label}
    </span>
  )
}

export default function ClinicalEvidenceCommandPage({
  countryLabel,
  countryIso2 = 'BR',
  roleLabel = 'All roles',
}: ClinicalEvidenceCommandPageProps) {
  const iso2 = (countryIso2 || 'BR').toUpperCase()
  const [records, setRecords] = useState<ClinicalEvidenceRecordDTO[]>([])
  const [evidenceState, setEvidenceState] = useState('loading')
  const [evidenceMessage, setEvidenceMessage] = useState('')
  const [formulary, setFormulary] = useState<FormularyProductDTO[]>([])
  const [modules, setModules] = useState<EduModule[]>([])
  const [interactions, setInteractions] = useState<InteractionRow[]>([])
  const [jurisdiction, setJurisdiction] = useState<{
    country?: string
    summary?: string
    legalPathway?: string
    primaryAuthority?: { name?: string; url?: string }
    lastReviewed?: string
    pathway?: { roles?: string; whoMayPrescribe?: string; notes?: string } | null
  } | null>(null)
  const [skus, setSkus] = useState<Array<Record<string, unknown>>>([])
  const [query, setQuery] = useState('')
  const [ixQuery, setIxQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [weightKg, setWeightKg] = useState('70')
  const [mgPerKg, setMgPerKg] = useState('2.5')
  const [dosesPerDay, setDosesPerDay] = useState('2')
  const [doseResult, setDoseResult] = useState<ReturnType<typeof computeWeightBasedCannabinoidDose> | null>(null)
  const [doseError, setDoseError] = useState<string | null>(null)

  const attention = getAttentionItems(iso2)
  const nextActions = getNextActions(iso2)

  const loadEvidence = useCallback(async (q: string) => {
    setError(null)
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    params.set('jurisdiction', iso2)
    params.set('limit', '30')
    const res = await fetch(`/api/clinical/evidence?${params}`)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setEvidenceState('error')
      setRecords([])
      setEvidenceMessage(body.message ?? `Evidence API ${res.status}`)
      setError(body.message ?? `Evidence API ${res.status}`)
      return
    }
    // Contract: ClinicalEvidenceSearchResult { state, records, message, changes }
    const list = Array.isArray(body.records) ? (body.records as ClinicalEvidenceRecordDTO[]) : []
    setRecords(list)
    setEvidenceState(typeof body.state === 'string' ? body.state : list.length ? 'loaded' : 'empty')
    setEvidenceMessage(typeof body.message === 'string' ? body.message : '')
  }, [iso2])

  const loadFormulary = useCallback(async () => {
    const res = await fetch(`/api/clinical/formulary?country=${encodeURIComponent(iso2)}&limit=40`)
    const body = await res.json().catch(() => ({}))
    setFormulary(Array.isArray(body.products) ? body.products : [])
    setSkus(Array.isArray(body.skus) ? body.skus : [])
  }, [iso2])

  const loadJurisdiction = useCallback(async () => {
    const res = await fetch(`/api/clinical/jurisdiction?country=${encodeURIComponent(iso2)}`)
    const body = await res.json().catch(() => ({}))
    setJurisdiction(body.profile ?? null)
  }, [iso2])

  const loadEducation = useCallback(async () => {
    const res = await fetch('/api/clinical/education')
    const body = await res.json().catch(() => ({}))
    setModules(Array.isArray(body.modules) ? body.modules : [])
  }, [])

  const loadInteractions = useCallback(async (q: string) => {
    const params = new URLSearchParams({ limit: '25' })
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/clinical/interactions?${params}`)
    const body = await res.json().catch(() => ({}))
    setInteractions(Array.isArray(body.interactions) ? body.interactions : [])
  }, [])

  useEffect(() => {
    startTransition(() => {
      void loadEvidence('')
      void loadFormulary()
      void loadEducation()
      void loadInteractions('')
      void loadJurisdiction()
    })
  }, [loadEvidence, loadFormulary, loadEducation, loadInteractions, loadJurisdiction])

  const filters = ['Evidence', 'Safety', 'Interactions', 'Formulations', 'Guidelines', 'Practice', 'Monitoring']

  const filtered = records.filter((r) => {
    if (!activeFilter || activeFilter === 'Evidence') return true
    const blob = `${r.title} ${r.summary} ${r.evidenceType} ${r.condition ?? ''} ${(r.cannabinoid ?? []).join(' ')}`.toLowerCase()
    const map: Record<string, RegExp> = {
      Safety: /safety|adverse|tolerab|sedation|hepatic|pharmacovigilance/,
      Interactions: /interaction|cyp|clobazam|drug/,
      Formulations: /formulation|oral|oromucosal|inhal|isolate|spectrum|oil/,
      Guidelines: /guideline|consensus|guidance/,
      Practice: /practice|prescrib|clinical/,
      Monitoring: /monitor|lab|hepatic|follow/,
    }
    return (map[activeFilter] ?? /./).test(blob)
  })

  function runDoseCalc() {
    setDoseError(null)
    setDoseResult(null)
    try {
      setDoseResult(
        computeWeightBasedCannabinoidDose({
          weightKg: Number(weightKg),
          mgPerKgPerDay: Number(mgPerKg),
          dosesPerDay: Math.round(Number(dosesPerDay)),
        }),
      )
    } catch (e) {
      setDoseError(e instanceof Error ? e.message : 'Calculation failed')
    }
  }

  const significanceTone = (s: string) => {
    if (s === 'major') return 'text-red-400'
    if (s === 'moderate') return 'text-amber-400'
    return 'text-white/70'
  }

  return (
    <div className="space-y-4 pb-8">
      <section className={`${card} p-4`}>
        <SectionLabel>Clinical</SectionLabel>
        <h2 className="text-xl font-semibold leading-snug text-white">Professional clinical command</h2>
        <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
          Reviewed cannabinoid and medical-cannabis clinical reference for medical professionals.
          Evidence, formulary and interactions stay distinct from product marketing and genetics.
          Not medical advice. Not patient-specific guidance.
        </p>
      </section>

      <section className={`${card} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Evidence command · {countryLabel}</SectionLabel>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`text-sm ${muted}`}>{roleLabel}</span>
              <StatusBadge
                label={filtered.length > 0 ? 'Ready' : evidenceState}
                tone={filtered.length > 0 ? 'ready' : 'empty'}
              />
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            startTransition(() => void loadEvidence(query))
          }}
          className="mt-4"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a condition or clinical question…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#d4a853]/50 focus:outline-none"
          />
        </form>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(activeFilter === f ? null : f)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                activeFilter === f ? 'bg-[#d4a853]/20 text-[#d4a853]' : 'bg-white/6 text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {isPending && <p className={`text-sm ${muted}`}>Loading reviewed evidence…</p>}
          {error && <p className="text-sm text-amber-400">{error}</p>}
          {!isPending && filtered.length === 0 && (
            <div className="rounded-lg bg-white/[0.03] px-3.5 py-4">
              <p className="text-sm font-medium text-white/80">
                {evidenceMessage || '0 reviewed records for this context'}
              </p>
              <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
                Search uses the production clinical evidence spine. State: {evidenceState}.
              </p>
            </div>
          )}
          {filtered.map((r) => (
            <article key={r.id} className={`${card} space-y-2 p-4`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-snug text-white/90">{r.title}</h3>
                <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-sky-400">
                  {r.evidenceStrength}
                </span>
              </div>
              <p className={`text-xs ${muted}`}>
                {[r.condition, (r.cannabinoid ?? []).join(', '), r.formulation].filter(Boolean).join(' · ')}
              </p>
              <p className={`text-sm leading-relaxed ${muted}`}>{r.summary}</p>
              {r.uncertainty && <p className="text-xs text-amber-400/80">{r.uncertainty}</p>}
              <div className={`border-t border-white/6 pt-2 text-[11px] ${muted}`}>
                {r.primarySource?.title ?? 'Source'} · Verified {r.verifiedAt?.slice(0, 10) ?? '—'}
                {r.primarySource?.url && (
                  <a href={r.primarySource.url} target="_blank" rel="noreferrer" className="ml-2 text-[#d4a853]">
                    Open ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Interactions tool */}
      <section className={`${card} p-4`}>
        <SectionLabel>Interactions tool</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Published cannabinoid–medication interaction references. Decision support only — confirm with
          primary sources and the patient&apos;s full medication list.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void loadInteractions(ixQuery)
          }}
        >
          <input
            value={ixQuery}
            onChange={(e) => setIxQuery(e.target.value)}
            placeholder="Search drug or cannabinoid (e.g. clobazam, CBD)…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35"
          />
          <button type="submit" className="rounded-lg bg-[#d4a853]/20 px-3 py-2 text-sm text-[#d4a853]">
            Search
          </button>
        </form>
        <ul className="mt-3 space-y-2">
          {interactions.map((ix) => (
            <li key={ix.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
              <p className="text-sm font-medium text-white/90">
                {ix.medicationIngredient} × {ix.cannabinoid}{' '}
                <span className={`text-xs uppercase ${significanceTone(ix.clinicalSignificance)}`}>
                  {ix.clinicalSignificance}
                </span>
              </p>
              {ix.mechanism && <p className={`mt-0.5 text-xs ${muted}`}>{ix.mechanism}</p>}
              {ix.monitoringConsideration && (
                <p className="mt-1 text-xs text-amber-400/90">{ix.monitoringConsideration}</p>
              )}
              <p className={`mt-1 text-[11px] ${muted}`}>
                {ix.primarySourceTitle} · {ix.evidenceCertainty}
                {ix.primarySourceUrl && (
                  <a href={ix.primarySourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-[#d4a853]">
                    Source ↗
                  </a>
                )}
              </p>
            </li>
          ))}
          {interactions.length === 0 && (
            <p className={`text-sm ${muted}`}>No published interaction rows for this search.</p>
          )}
        </ul>
      </section>

      {/* Dosing */}
      <section className={`${card} p-4`}>
        <SectionLabel>Decision support · starting dose helper</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Algorithm {DOSING_ALGORITHM_VERSION}. Not a prescription. Confirm formulary and jurisdiction.
          Values ≥ {CAUTION_MG_PER_KG_PER_DAY} mg/kg/day are flagged.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <label className={`text-xs ${muted}`}>
            Weight (kg)
            <input className="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </label>
          <label className={`text-xs ${muted}`}>
            mg/kg/day
            <input className="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" value={mgPerKg} onChange={(e) => setMgPerKg(e.target.value)} />
          </label>
          <label className={`text-xs ${muted}`}>
            Doses/day
            <input className="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white" value={dosesPerDay} onChange={(e) => setDosesPerDay(e.target.value)} />
          </label>
        </div>
        <button type="button" onClick={runDoseCalc} className="mt-3 rounded-lg bg-[#d4a853]/20 px-3 py-1.5 text-sm font-medium text-[#d4a853]">
          Calculate starting point
        </button>
        {doseError && <p className="mt-2 text-sm text-amber-400">{doseError}</p>}
        {doseResult && (
          <div className={`mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-sm ${muted}`}>
            <p>
              Total {doseResult.totalMgPerDay} mg/day · {doseResult.mgPerDose} mg/dose · {doseResult.dosesPerDay}× daily
            </p>
            {doseResult.cautions.map((c) => (
              <p key={c} className="mt-1 text-xs text-amber-400/90">· {c}</p>
            ))}
          </div>
        )}
      </section>

      {/* Formulary SKU/class */}
      <section className={`${card} p-4`}>
        <SectionLabel>Formulary · {countryLabel}</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Published authorised product / class reference. Prefer registration codes when present. Always verify the live authority register — SKU lists change.
        </p>
        <ul className="mt-3 space-y-3">
          {formulary.map((p) => (
            <li key={p.id} className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <p className="text-sm font-medium text-white/90">{p.name}</p>
              {(p.brandName || p.registrationCode || p.strengthLabel) && (
                <p className={`mt-0.5 text-xs text-[#d4a853]/90`}>
                  {[p.brandName, p.registrationCode, p.strengthLabel].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className={`mt-0.5 text-xs ${muted}`}>
                {p.authorizationStatus} · {p.productClass} · {p.cannabinoidProfile}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{p.notes}</p>
              {p.primarySourceUrl && (
                <a href={p.primarySourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-[#d4a853]">
                  Open primary source ↗
                </a>
              )}
            </li>
          ))}
          {formulary.length === 0 && <p className={`text-sm ${muted}`}>No published formulary rows for this jurisdiction.</p>}
        </ul>
      </section>

      {/* National SKUs from authority feeds */}
      <section className={`${card} p-4`}>
        <SectionLabel>National SKU feed · {countryLabel}</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Product-level rows from ANVISA/TGA feeds or curated authority snapshots. Prefer registration codes when present. Always verify the live register — catalogues change.
        </p>
        <ul className="mt-3 space-y-3">
          {skus.map((s) => (
            <li key={String(s.id)} className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <p className="text-sm font-medium text-white/90">{String(s.productName)}</p>
              <p className={`mt-0.5 text-xs text-[#d4a853]/90`}>
                {[s.authority, s.registrationCode, s.brandName, s.strengthLabel].filter(Boolean).map(String).join(' · ')}
              </p>
              <p className={`mt-0.5 text-xs ${muted}`}>
                {String(s.authorizationStatus)} · {String(s.sourceType)} · {String(s.cannabinoidProfile ?? '')}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{String(s.notes ?? '')}</p>
              {s.sourceUrl ? (
                <a href={String(s.sourceUrl)} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-[#d4a853]">
                  Open source ↗
                </a>
              ) : null}
            </li>
          ))}
          {skus.length === 0 && (
            <p className={`text-sm ${muted}`}>
              No published national SKUs for this jurisdiction yet. Run the clinical SKU feed cron for ANVISA/TGA.
            </p>
          )}
        </ul>
      </section>

      {/* Education from live API */}
      <section className={`${card} p-4`}>
        <SectionLabel>Clinical education modules</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Live professional education modules (approved / Live only). Separate from graded evidence.
        </p>
        <ul className="mt-3 space-y-2">
          {modules.slice(0, 8).map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white/90">{m.title}</p>
                <p className={`text-xs ${muted}`}>
                  {m.moduleStatus ?? '—'} · {m.riskLevel ?? '—'} risk
                </p>
              </div>
              <Link
                href={m.route || `/network/clinical-education/${m.slug}`}
                className="shrink-0 text-xs font-medium text-[#d4a853]"
              >
                Open →
              </Link>
            </li>
          ))}
          {modules.length === 0 && <p className={`text-sm ${muted}`}>No published education modules available.</p>}
        </ul>
        <Link href="/network/clinical-education" className="mt-3 inline-flex text-sm font-medium text-[#d4a853]">
          All clinical education →
        </Link>
      </section>

      {jurisdiction && (
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Jurisdiction briefing · {jurisdiction.country}</SectionLabel>
            <StatusBadge label="Loaded" tone="loaded" />
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{jurisdiction.summary}</p>
        </section>
      )}

      <section className={`${card} p-4`}>
        <SectionLabel>What requires attention</SectionLabel>
        <ul className="mt-2 space-y-3">
          {attention.map((item) => (
            <li key={item.id}>
              <p className="text-sm font-medium text-white/90">{item.title}</p>
              <p className={`mt-0.5 text-sm leading-relaxed ${muted}`}>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {jurisdiction?.pathway && (
        <section className={`${card} p-4`}>
          <SectionLabel>Professional pathway</SectionLabel>
          <p className={`text-xs ${muted}`}>{jurisdiction.pathway?.roles}</p>
          <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{jurisdiction.pathway?.whoMayPrescribe}</p>
        </section>
      )}
    </div>
  )
}
