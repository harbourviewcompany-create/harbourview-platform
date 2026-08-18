/**
 * Clinical Evidence Command — unified data path
 * Evidence: GET /api/clinical/evidence
 * Formulary: GET /api/clinical/formulary
 * Education: dual surface link
 * Dosing / interactions: decision-support helpers (not prescriptions)
 */
'use client'

import React, { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import {
  JURISDICTION_BRIEFINGS,
  PROFESSIONAL_PATHWAYS,
  getAttentionItems,
  getNextActions,
} from '@/lib/fixtures/clinical/jurisdictions'
import {
  computeWeightBasedCannabinoidDose,
  DOSING_ALGORITHM_VERSION,
  CAUTION_MG_PER_KG_PER_DAY,
} from '@/lib/clinical/dosing'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'

export type ClinicalEvidenceCommandPageProps = {
  countryLabel: string
  countryIso2?: string | null
  roleLabel?: string
}

type EvidenceApiRecord = {
  id: string
  title: string
  summary: string
  condition?: string | null
  cannabinoid?: string[]
  formulation?: string | null
  evidenceStrength?: string
  evidenceType?: string
  uncertainty?: string | null
  primarySource?: { title?: string; publisher?: string; url?: string }
  verifiedAt?: string
  jurisdictions?: string[]
}

type EvidenceApiResult = {
  state?: string
  records?: EvidenceApiRecord[]
  items?: EvidenceApiRecord[]
  data?: EvidenceApiRecord[]
  message?: string
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

function extractRecords(payload: EvidenceApiResult): EvidenceApiRecord[] {
  if (Array.isArray(payload.records)) return payload.records
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.data)) return payload.data
  return []
}

export default function ClinicalEvidenceCommandPage({
  countryLabel,
  countryIso2 = 'BR',
  roleLabel = 'All roles',
}: ClinicalEvidenceCommandPageProps) {
  const iso2 = (countryIso2 || 'BR').toUpperCase()
  const [records, setRecords] = useState<EvidenceApiRecord[]>([])
  const [formulary, setFormulary] = useState<FormularyProductDTO[]>([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [evidenceState, setEvidenceState] = useState<string>('loading')
  const [formularyState, setFormularyState] = useState<string>('loading')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Dosing calculator (decision support only)
  const [weightKg, setWeightKg] = useState('70')
  const [mgPerKg, setMgPerKg] = useState('2.5')
  const [dosesPerDay, setDosesPerDay] = useState('2')
  const [doseResult, setDoseResult] = useState<ReturnType<typeof computeWeightBasedCannabinoidDose> | null>(null)
  const [doseError, setDoseError] = useState<string | null>(null)

  const briefing = JURISDICTION_BRIEFINGS[iso2] ?? null
  const pathway = PROFESSIONAL_PATHWAYS[iso2] ?? null
  const attention = getAttentionItems(iso2)
  const nextActions = getNextActions(iso2)

  const loadEvidence = useCallback(
    async (q: string) => {
      setError(null)
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      params.set('jurisdiction', iso2)
      params.set('limit', '30')
      const res = await fetch(`/api/clinical/evidence?${params}`)
      const body = (await res.json().catch(() => ({}))) as EvidenceApiResult
      if (!res.ok) {
        setEvidenceState('error')
        setRecords([])
        setError(body.message ?? `Evidence API ${res.status}`)
        return
      }
      const list = extractRecords(body)
      setRecords(list)
      setEvidenceState(body.state ?? (list.length ? 'loaded' : 'empty'))
    },
    [iso2],
  )

  const loadFormulary = useCallback(async () => {
    const params = new URLSearchParams({ country: iso2, limit: '30' })
    const res = await fetch(`/api/clinical/formulary?${params}`)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setFormularyState('error')
      setFormulary([])
      return
    }
    setFormulary(body.products ?? [])
    setFormularyState(body.state ?? 'empty')
  }, [iso2])

  useEffect(() => {
    startTransition(() => {
      void loadEvidence('')
      void loadFormulary()
    })
  }, [loadEvidence, loadFormulary])

  const filters = ['Evidence', 'Safety', 'Interactions', 'Formulations', 'Guidelines', 'Practice', 'Monitoring']

  const filtered = records.filter((r) => {
    if (!activeFilter) return true
    const blob = `${r.title} ${r.summary} ${r.evidenceType ?? ''} ${r.condition ?? ''}`.toLowerCase()
    const map: Record<string, RegExp> = {
      Evidence: /efficac|trial|review|pain|epilepsy|condition/,
      Safety: /safety|adverse|tolerab|sedation|hepatic/,
      Interactions: /interaction|cyp|clobazam|drug–drug|drug-drug/,
      Formulations: /formulation|oral|oromucosal|inhal|isolate|spectrum/,
      Guidelines: /guideline|consensus|guidance/,
      Practice: /practice|prescrib|monitoring|clinical/,
      Monitoring: /monitor|lab|hepatic|follow/,
    }
    return (map[activeFilter] ?? /./).test(blob)
  })

  function runDoseCalc() {
    setDoseError(null)
    setDoseResult(null)
    try {
      const result = computeWeightBasedCannabinoidDose({
        weightKg: Number(weightKg),
        mgPerKgPerDay: Number(mgPerKg),
        dosesPerDay: Math.round(Number(dosesPerDay)),
      })
      setDoseResult(result)
    } catch (e) {
      setDoseError(e instanceof Error ? e.message : 'Calculation failed')
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <section className={`${card} p-4`}>
        <SectionLabel>Clinical</SectionLabel>
        <h2 className="text-xl font-semibold leading-snug text-white">Professional clinical command</h2>
        <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
          Reviewed cannabinoid and medical-cannabis clinical reference for medical professionals.
          Evidence and regulatory status stay distinct from product marketing and genetics.
          Not a general medicines monograph service. Not patient-specific advice.
        </p>
      </section>

      {/* Evidence — API-backed */}
      <section className={`${card} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Evidence command · {countryLabel}</SectionLabel>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`text-sm ${muted}`}>{roleLabel}</span>
              <StatusBadge
                label={filtered.length > 0 ? 'Ready' : evidenceState === 'loading' ? 'Loading' : 'No records'}
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
              <p className="text-sm font-medium text-white/80">0 reviewed records for this context</p>
              <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
                Enter a condition or clinical question to search reviewed evidence from the production
                clinical evidence spine. Not patient-specific advice.
              </p>
            </div>
          )}
          {filtered.map((r) => (
            <article key={r.id} className={`${card} space-y-2 p-4`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-snug text-white/90">{r.title}</h3>
                {r.evidenceStrength && (
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-sky-400">
                    {r.evidenceStrength}
                  </span>
                )}
              </div>
              <p className={`text-xs ${muted}`}>
                {[r.condition, (r.cannabinoid ?? []).join(', '), r.formulation].filter(Boolean).join(' · ')}
              </p>
              <p className={`text-sm leading-relaxed ${muted}`}>{r.summary}</p>
              {r.uncertainty && <p className={`text-xs text-amber-400/80`}>{r.uncertainty}</p>}
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

      {/* Decision support: dosing + interactions */}
      <section className={`${card} p-4`}>
        <SectionLabel>Decision support · starting dose helper</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Weight-based starting-dose calculator (algorithm {DOSING_ALGORITHM_VERSION}). Decision support only —
          not a prescription. Confirm formulary, jurisdiction, and professional scope before use.
          Values ≥ {CAUTION_MG_PER_KG_PER_DAY} mg/kg/day are flagged for extra attention.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <label className={`text-xs ${muted}`}>
            Weight (kg)
            <input
              className="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </label>
          <label className={`text-xs ${muted}`}>
            mg/kg/day
            <input
              className="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              value={mgPerKg}
              onChange={(e) => setMgPerKg(e.target.value)}
            />
          </label>
          <label className={`text-xs ${muted}`}>
            Doses/day
            <input
              className="mt-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              value={dosesPerDay}
              onChange={(e) => setDosesPerDay(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={runDoseCalc}
          className="mt-3 rounded-lg bg-[#d4a853]/20 px-3 py-1.5 text-sm font-medium text-[#d4a853]"
        >
          Calculate starting point
        </button>
        {doseError && <p className="mt-2 text-sm text-amber-400">{doseError}</p>}
        {doseResult && (
          <div className={`mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-sm ${muted}`}>
            <p>
              Total {doseResult.totalMgPerDay} mg/day · {doseResult.mgPerDose} mg/dose ·{' '}
              {doseResult.dosesPerDay}× daily
            </p>
            {doseResult.cautions.map((c) => (
              <p key={c} className="mt-1 text-xs text-amber-400/90">
                · {c}
              </p>
            ))}
          </div>
        )}
        <div className={`mt-4 border-t border-white/6 pt-3 text-sm ${muted}`}>
          <p className="font-medium text-white/80">Interactions</p>
          <p className="mt-1 leading-relaxed">
            CBD is a more significant CYP inhibitor (CYP3A4, CYP2C19, CYP2C9) than THC in most contexts.
            Monitor with clobazam and narrow-therapeutic-index substrates. Search evidence with filter
            “Interactions” for graded records. Always cross-check current medications against a dedicated
            interaction resource and the primary authority.
          </p>
        </div>
      </section>

      {/* Formulary — API */}
      <section className={`${card} p-4`}>
        <SectionLabel>Formulary · {countryLabel}</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Jurisdiction-authorised product reference only. Not marketplace listings. Verify the live register.
        </p>
        {formularyState === 'loading' && <p className={`mt-2 text-sm ${muted}`}>Loading formulary…</p>}
        {formulary.length === 0 && formularyState !== 'loading' && (
          <p className={`mt-3 text-sm ${muted}`}>No published formulary rows for this jurisdiction yet.</p>
        )}
        <ul className="mt-3 space-y-3">
          {formulary.map((p) => (
            <li key={p.id} className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <p className="text-sm font-medium text-white/90">{p.name}</p>
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
        </ul>
      </section>

      {/* Education dual surface */}
      <section className={`${card} p-4`}>
        <SectionLabel>Clinical education modules</SectionLabel>
        <p className={`text-sm leading-relaxed ${muted}`}>
          Professional education themes — separate from graded evidence records.
        </p>
        <ul className="mt-3 space-y-2">
          {clinicalEducationModules
            .filter((m) => m.publicUseApproved || m.moduleStatus === 'Live')
            .slice(0, 6)
            .map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white/90">{m.title}</p>
                  <p className={`text-xs ${muted}`}>
                    {m.moduleStatus} · {m.riskLevel} risk
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
        </ul>
        <Link href="/network/clinical-education" className="mt-3 inline-flex text-sm font-medium text-[#d4a853]">
          All clinical education →
        </Link>
      </section>

      {briefing && (
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Jurisdiction briefing · {briefing.country}</SectionLabel>
            <StatusBadge label="Loaded" tone="loaded" />
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{briefing.summary}</p>
          {briefing.primaryAuthority.url && (
            <a href={briefing.primaryAuthority.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-[#d4a853]">
              Open primary source ↗
            </a>
          )}
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

      <section className={`${card} p-4`}>
        <SectionLabel>What can I do next</SectionLabel>
        {nextActions.map((action) => (
          <div key={action.id} className="mt-2">
            <p className="text-sm font-medium text-white/90">{action.title}</p>
            <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{action.body}</p>
            {action.primaryActionUrl && (
              <a href={action.primaryActionUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm text-[#d4a853]">
                {action.primaryActionLabel}
              </a>
            )}
          </div>
        ))}
      </section>

      {pathway && (
        <section className={`${card} p-4`}>
          <SectionLabel>Professional pathway</SectionLabel>
          <p className={`text-xs ${muted}`}>{pathway.roles}</p>
          <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{pathway.whoMayPrescribe}</p>
        </section>
      )}
    </div>
  )
}
