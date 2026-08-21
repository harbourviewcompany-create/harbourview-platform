'use client'

/**
 * Phase B — Admin Claim Map + gap dashboard.
 * Fixture-backed until optional framework_alignment persistence ships.
 * Commercial evidence strategy only; not clinician directives.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CLAIM_MAP_FIXTURES } from '@/lib/fixtures/clinical/claim-map'
import { EVIDENCE_FIXTURES } from '@/lib/fixtures/clinical/evidence'
import {
  gapsFromClaimMap,
  gapsFromEvidenceRecords,
  sortGapsForTriage,
  summariseGaps,
  type GapItem,
} from '@/lib/clinical/framework-gap'
import type { EvidenceClaimMapEntry } from '@/lib/clinical/types'

function statusBadgeClass(status: string) {
  if (status === 'complete' || status === 'covered') return 'bg-emerald-700/40 text-emerald-100'
  if (status === 'partial') return 'bg-amber-700/40 text-amber-100'
  if (status === 'gap' || status === 'missing' || status === 'unmapped')
    return 'bg-red-800/40 text-red-100'
  return 'bg-white/10 text-white/70'
}

export default function ClaimMapAdminPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [draftJson, setDraftJson] = useState('')
  const [draftMsg, setDraftMsg] = useState<string | null>(null)

  const claimGaps = useMemo(() => gapsFromClaimMap(CLAIM_MAP_FIXTURES), [])
  const evidenceGaps = useMemo(() => gapsFromEvidenceRecords(EVIDENCE_FIXTURES), [])
  const allGaps = useMemo(
    () => sortGapsForTriage([...claimGaps, ...evidenceGaps]),
    [claimGaps, evidenceGaps]
  )
  const summary = useMemo(() => summariseGaps(allGaps), [allGaps])

  const filteredGaps = useMemo(() => {
    return allGaps.filter((g) => {
      if (filterStatus !== 'all' && g.status !== filterStatus) return false
      if (filterPriority !== 'all' && (g.commercialPriority ?? 'low') !== filterPriority)
        return false
      return true
    })
  }, [allGaps, filterStatus, filterPriority])

  function validateDraft() {
    setDraftMsg(null)
    try {
      const parsed = JSON.parse(draftJson) as EvidenceClaimMapEntry
      if (!parsed.id || !parsed.claimStatement || !parsed.frameworkAlignment) {
        setDraftMsg('Missing id, claimStatement, or frameworkAlignment')
        return
      }
      setDraftMsg(
        `Valid claim map shape for “${parsed.id}”. Copy into claim-map fixtures or store in intake notes until DB persistence.`
      )
    } catch (e) {
      setDraftMsg(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-6 pb-24 text-sm text-[#f5f1e8] sm:px-6">
      <header className="space-y-2 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a55a]">
              Admin · Clinical · Phase B
            </p>
            <h1 className="text-xl font-semibold sm:text-2xl">Evidence Claim Map</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/clinical-review"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80"
            >
              Review queue
            </Link>
            <Link
              href="/admin/hub"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80"
            >
              Admin hub
            </Link>
          </div>
        </div>
        <p className="text-xs leading-5 text-white/55">
          Map commercial evidence strategy claims (IMDRF / DTA / DTx RWE / FDA RWE) to clinical
          evidence records. Fixture-backed; optional DB persistence documented. Not medical advice;
          not SaMD.
        </p>
      </header>

      {/* Gap dashboard */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90">Gap dashboard</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total gaps" value={String(summary.totalGaps)} />
          <StatCard label="Missing" value={String(summary.byStatus.missing ?? 0)} tone="red" />
          <StatCard label="Partial" value={String(summary.byStatus.partial ?? 0)} tone="amber" />
          <StatCard label="High priority" value={String(summary.highPriority)} tone="gold" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/55">
          <div className="mb-1 font-medium text-white/70">By dimension</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byDimensionPrefix).map(([k, v]) => (
              <span key={k} className="rounded-md bg-white/5 px-2 py-1">
                {k}: {v}
              </span>
            ))}
          </div>
          <p className="mt-2">
            Unmapped evidence fixtures: {summary.unmappedEvidence} (of {EVIDENCE_FIXTURES.length})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="missing">Missing</option>
            <option value="unmapped">Unmapped</option>
            <option value="partial">Partial</option>
          </select>
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {filteredGaps.slice(0, 40).map((g: GapItem, idx) => (
            <li
              key={`${g.sourceId}-${g.dimension}-${idx}`}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${statusBadgeClass(g.status)}`}>
                  {g.status}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-white/40">{g.source}</span>
                <span className="text-[11px] text-[#c6a55a]">{g.dimension}</span>
                {g.commercialPriority && (
                  <span className="text-[10px] text-white/45">pri:{g.commercialPriority}</span>
                )}
              </div>
              <div className="mt-1 text-xs text-white/80">{g.label}</div>
              {g.notes && <div className="mt-0.5 text-[11px] text-white/45">{g.notes}</div>}
              {(g.gapOwner || g.targetDate) && (
                <div className="mt-0.5 text-[10px] text-white/35">
                  {g.gapOwner ? `owner: ${g.gapOwner}` : ''}{' '}
                  {g.targetDate ? `· target ${g.targetDate}` : ''}
                </div>
              )}
            </li>
          ))}
          {filteredGaps.length === 0 && (
            <p className="text-xs text-white/45">No gaps match filters.</p>
          )}
        </ul>
      </section>

      {/* Claim map table */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90">
          Claim map ({CLAIM_MAP_FIXTURES.length})
        </h2>
        <ul className="space-y-3">
          {CLAIM_MAP_FIXTURES.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${statusBadgeClass(c.status)}`}>
                  {c.status}
                </span>
                <span className="text-[10px] text-white/40">{c.claimKind}</span>
                {c.frameworkAlignment.commercialStageGate && (
                  <span className="text-[10px] text-[#c6a55a]">
                    gate: {c.frameworkAlignment.commercialStageGate}
                  </span>
                )}
                {c.frameworkAlignment.commercialPriority && (
                  <span className="text-[10px] text-white/45">
                    pri: {c.frameworkAlignment.commercialPriority}
                  </span>
                )}
              </div>
              <div className="mt-1 font-medium leading-snug">{c.claimStatement}</div>
              <div className="mt-1 break-all text-[11px] text-white/45">
                {c.id} · evidence: {c.evidenceRecordIds.join(', ')}
                {c.gapOwner ? ` · owner ${c.gapOwner}` : ''}
                {c.targetDate ? ` · target ${c.targetDate}` : ''}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                {c.frameworkAlignment.imdrfPillars &&
                  Object.entries(c.frameworkAlignment.imdrfPillars).map(([k, v]) => (
                    <span
                      key={k}
                      className={`rounded px-1.5 py-0.5 ${statusBadgeClass(v.status)}`}
                      title={v.notes}
                    >
                      imdrf:{k}={v.status}
                    </span>
                  ))}
                {(c.frameworkAlignment.dtaDomains ?? []).map((d, i) => (
                  <span
                    key={`${d.domain}-${d.ecosystem}-${i}`}
                    className={`rounded px-1.5 py-0.5 ${statusBadgeClass(d.status)}`}
                    title={d.notes}
                  >
                    dta:{d.domain}/{d.ecosystem}={d.status}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Minimal admin form — validate claim map JSON */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90">Minimal form · claim map JSON</h2>
        <p className="text-[11px] text-white/45">
          Paste an <code className="text-white/70">EvidenceClaimMapEntry</code> JSON object to
          validate shape. Until optional persistence migration is applied, store validated drafts in
          intake notes or commit to{' '}
          <code className="text-white/70">lib/fixtures/clinical/claim-map.ts</code>.
        </p>
        <textarea
          className="min-h-40 w-full rounded-xl border border-white/15 bg-black/40 p-3 font-mono text-[11px] text-white/90"
          placeholder='{"id":"claim-...","claimStatement":"...","claimKind":"efficacy","frameworkAlignment":{...},"evidenceRecordIds":[],"status":"partial"}'
          value={draftJson}
          onChange={(e) => setDraftJson(e.target.value)}
        />
        <button
          type="button"
          onClick={validateDraft}
          className="rounded-lg border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-3 py-2 text-xs text-[#e6c979]"
        >
          Validate claim map JSON
        </button>
        {draftMsg && (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
            {draftMsg}
          </p>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'red' | 'amber' | 'gold'
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-500/30 text-red-100'
      : tone === 'amber'
        ? 'border-amber-500/30 text-amber-100'
        : tone === 'gold'
          ? 'border-[#c6a55a]/40 text-[#e6c979]'
          : 'border-white/10 text-white/90'
  return (
    <div className={`rounded-xl border bg-white/[0.03] p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}
