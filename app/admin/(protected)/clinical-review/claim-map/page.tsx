'use client'

/**
 * Claim-map + framework gap dashboard (operator).
 * Loads live clinical_evidence_claim_map when migration is applied; falls back to fixtures.
 * Persist via POST /api/clinical/admin/framework-alignment. Does not publish clinical conclusions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CLAIM_MAP_FIXTURES } from '@/lib/fixtures/clinical/claim-map'
import { EVIDENCE_FIXTURES } from '@/lib/fixtures/clinical/evidence'
import {
  assessClaimMapReadiness,
  corridorEvidenceFlags,
} from '@/lib/clinical/evidence-readiness'
import { summariseGaps, triageSort } from '@/lib/clinical/framework-gap'
import { CorridorEvidenceFlagsPanel } from '@/components/clinical/CorridorEvidenceFlagsPanel'
import type { EvidenceClaimMapEntry } from '@/lib/clinical/types'

type LiveClaim = EvidenceClaimMapEntry & { source?: 'live' | 'fixture' }

export default function ClaimMapAdminPage() {
  const [filter, setFilter] = useState('')
  const [jsonDraft, setJsonDraft] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [entries, setEntries] = useState<LiveClaim[]>(
    CLAIM_MAP_FIXTURES.map((e) => ({ ...e, source: 'fixture' as const })),
  )
  const [liveAvailable, setLiveAvailable] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await fetch('/api/clinical/admin/framework-alignment')
      if (res.status === 401 || res.status === 403) {
        setLiveAvailable(false)
        setLoadError('Admin auth required for live claim-map. Showing fixtures.')
        return
      }
      if (!res.ok) {
        setLiveAvailable(false)
        setLoadError(`Live load failed (${res.status}). Showing fixtures.`)
        return
      }
      const data = await res.json()
      setLiveAvailable(Boolean(data.liveAvailable))
      const liveRows = (data.claimMap ?? []) as EvidenceClaimMapEntry[]
      if (liveRows.length > 0) {
        setEntries(liveRows.map((e) => ({ ...e, source: 'live' as const })))
      } else {
        // Merge: fixtures as baseline when table empty
        setEntries(CLAIM_MAP_FIXTURES.map((e) => ({ ...e, source: 'fixture' as const })))
      }
      if (data.errors?.claimMap) {
        setLoadError(`DB: ${data.errors.claimMap} — fixtures in use until migration applied.`)
        setLiveAvailable(false)
      }
    } catch {
      setLiveAvailable(false)
      setLoadError('Network error loading live claim-map. Showing fixtures.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.condition.toLowerCase().includes(q) ||
        e.claimStatement.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
    )
  }, [filter, entries])

  const assessments = useMemo(
    () => filtered.map((e) => assessClaimMapReadiness(e, EVIDENCE_FIXTURES)),
    [filtered],
  )

  const allGaps = useMemo(
    () => triageSort(assessments.flatMap((a) => a.gaps)),
    [assessments],
  )
  const gapSummary = useMemo(() => summariseGaps(allGaps), [allGaps])
  const corridorFlags = useMemo(
    () => corridorEvidenceFlags(filtered, EVIDENCE_FIXTURES),
    [filtered],
  )

  async function persistEntry(entry: EvidenceClaimMapEntry) {
    setBusy(true)
    setSaveMsg(null)
    setParseError(null)
    try {
      const res = await fetch('/api/clinical/admin/framework-alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_claim_map',
          slug: entry.id,
          claimStatement: entry.claimStatement,
          conditionLabel: entry.condition,
          cannabinoidFocus: entry.cannabinoidFocus ?? [],
          evidenceRecordIds: entry.evidenceRecordIds ?? [],
          targetStageGates: entry.targetStageGates ?? [],
          targetImdrfPillars: entry.targetImdrfPillars ?? [],
          targetDtaDomains: entry.targetDtaDomains ?? [],
          status: entry.status,
          gapSummary: entry.gapSummary ?? null,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setParseError(body.error ?? `Save failed (${res.status})`)
        // Still keep local for operator work
        setEntries((prev) => {
          const without = prev.filter((p) => p.id !== entry.id)
          return [...without, { ...entry, source: 'fixture' as const }]
        })
        return
      }
      setSaveMsg(`Saved ${entry.id} to clinical_evidence_claim_map`)
      setLiveAvailable(true)
      await load()
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  function addFromJson() {
    setParseError(null)
    setSaveMsg(null)
    try {
      const parsed = JSON.parse(jsonDraft) as EvidenceClaimMapEntry
      if (!parsed.id || !parsed.claimStatement) {
        setParseError('Requires id and claimStatement')
        return
      }
      const entry: EvidenceClaimMapEntry = {
        ...parsed,
        condition: parsed.condition ?? (parsed as { conditionLabel?: string }).conditionLabel ?? '',
        updatedAt: parsed.updatedAt ?? new Date().toISOString().slice(0, 10),
      }
      setEntries((prev) => {
        const without = prev.filter((p) => p.id !== entry.id)
        return [...without, { ...entry, source: 'fixture' as const }]
      })
      setJsonDraft('')
      void persistEntry(entry)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  async function seedFixturesToLive() {
    setBusy(true)
    setSaveMsg(null)
    try {
      for (const f of CLAIM_MAP_FIXTURES) {
        await persistEntry(f)
      }
      setSaveMsg(`Seeded ${CLAIM_MAP_FIXTURES.length} fixture claim-map rows`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 text-sm">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/clinical-review" className="text-xs text-neutral-500 hover:underline">
            ← Clinical review
          </Link>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
              liveAvailable
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {liveAvailable === null ? 'checking…' : liveAvailable ? 'live DB' : 'fixtures'}
          </span>
        </div>
        <h1 className="text-xl font-semibold">Claim map & framework gaps</h1>
        <p className="text-neutral-500">
          Operator view of commercial claim statements, stage-gate readiness, and IMDRF/DTA/ALCOA+/FDA
          RWE gaps. Live persistence via{' '}
          <code className="text-xs">clinical_evidence_claim_map</code> +{' '}
          <code className="text-xs">framework_alignment</code>. Not medical advice.
        </p>
        {loadError && <p className="text-xs text-amber-700 dark:text-amber-300">{loadError}</p>}
        {saveMsg && <p className="text-xs text-emerald-700 dark:text-emerald-300">{saveMsg}</p>}
      </header>

      <CorridorEvidenceFlagsPanel flags={corridorFlags} />

      <section className="space-y-2">
        <h2 className="font-medium">Gap summary</h2>
        <div className="flex flex-wrap gap-3 text-xs">
          <span>Total {gapSummary.total}</span>
          <span className="text-red-700">Critical {gapSummary.bySeverity.critical}</span>
          <span className="text-amber-700">High {gapSummary.bySeverity.high}</span>
          <span>Medium {gapSummary.bySeverity.medium}</span>
          <span className="text-neutral-500">Low {gapSummary.bySeverity.low}</span>
        </div>
        {allGaps.slice(0, 12).map((g) => (
          <div key={g.id} className="rounded border border-neutral-200 px-2 py-1 text-xs dark:border-neutral-700">
            <span className="font-medium uppercase text-neutral-500">{g.severity}</span> · {g.framework} ·{' '}
            {g.message}
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Filter condition / claim / id"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-[200px] flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-600"
        >
          Refresh
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void seedFixturesToLive()}
          className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-600"
          title="Upsert fixture claim-map rows into live table"
        >
          Seed fixtures → live
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Claim-map entries ({filtered.length})</h2>
        <ul className="space-y-3">
          {assessments.map((a) => {
            const entry = entries.find((e) => e.id === a.claimId)
            if (!entry) return null
            return (
              <li
                key={a.claimId}
                className="rounded border border-neutral-200 p-3 dark:border-neutral-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{entry.condition}</div>
                    <div className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {entry.claimStatement}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-medium capitalize">{a.status}</div>
                    <div>Score {a.score}</div>
                    <div className="text-[10px] text-neutral-500">{entry.source ?? '—'}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                  {entry.targetStageGates.map((g) => (
                    <span
                      key={g}
                      className={`rounded border px-1.5 py-0.5 ${
                        a.stageGatesReady.includes(g)
                          ? 'border-emerald-300 text-emerald-800'
                          : 'border-neutral-300 text-neutral-500'
                      }`}
                    >
                      {g.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">
                  Evidence: {a.supportingRecordIds.join(', ') || '—'} · Gaps {a.summary.total} (crit{' '}
                  {a.summary.bySeverity.critical})
                </div>
                {entry.gapSummary && (
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">{entry.gapSummary}</p>
                )}
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded bg-neutral-800 px-2 py-1 text-[11px] text-white disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900"
                    onClick={() => void persistEntry(entry)}
                  >
                    Persist to live
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Add / update claim (JSON → live)</h2>
        <p className="text-xs text-neutral-500">
          Parses JSON, updates local list, then POSTs upsert to clinical_evidence_claim_map when
          migration is applied.
        </p>
        <textarea
          value={jsonDraft}
          onChange={(e) => setJsonDraft(e.target.value)}
          rows={6}
          placeholder='{"id":"claim-…","claimStatement":"…","condition":"…","cannabinoidFocus":["CBD"],"evidenceRecordIds":["ev-…"],"targetStageGates":["pilot_corridor"],"status":"partial","updatedAt":"2026-08-21"}'
          className="w-full rounded border border-neutral-300 p-2 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-900"
        />
        {parseError && <p className="text-xs text-red-600">{parseError}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={addFromJson}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Apply &amp; persist
        </button>
      </section>
    </div>
  )
}
