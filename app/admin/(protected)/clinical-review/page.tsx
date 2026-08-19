'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type EvidenceRow = {
  id: string
  slug: string
  title: string
  review_status: string
  evidence_strength?: string
  jurisdictions?: string[]
  updated_at?: string
}

type FormularyRow = {
  id: string
  slug: string
  name: string
  country_iso2: string
  authorization_status: string
  review_status: string
  updated_at?: string
}

type SkuRow = {
  id: string
  product_name?: string
  country_iso2?: string
  review_status?: string
  authority?: string
}

export default function ClinicalReviewAdminPage() {
  const [evidence, setEvidence] = useState<EvidenceRow[]>([])
  const [formulary, setFormulary] = useState<FormularyRow[]>([])
  const [skus, setSkus] = useState<SkuRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadErrors, setLoadErrors] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/clinical/admin/review?entity=both', {
        credentials: 'include',
        cache: 'no-store',
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          typeof body.error === 'string'
            ? body.error
            : `Could not load review queue (${res.status}). Sign in as admin and retry.`
        )
        setEvidence([])
        setFormulary([])
        setSkus([])
        return
      }
      setEvidence(Array.isArray(body.evidence) ? body.evidence : [])
      setFormulary(Array.isArray(body.formulary) ? body.formulary : [])
      setSkus(Array.isArray(body.skus) ? body.skus : [])
      setLoadErrors(Array.isArray(body.loadErrors) ? body.loadErrors : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading clinical review')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(
    entity: 'evidence' | 'formulary',
    id: string,
    review_status: 'published' | 'under-review' | 'retired'
  ) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch('/api/clinical/admin/review', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id, review_status }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : `Update failed (${res.status})`)
        return
      }
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-6 pb-24 text-sm text-[#f5f1e8] sm:px-6">
      <header className="space-y-2 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a55a]">Admin · Clinical</p>
            <h1 className="text-xl font-semibold sm:text-2xl">Clinical review queue</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/hub"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80"
            >
              Admin hub
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-3 py-2 text-xs text-[#e6c979]"
            >
              Refresh
            </button>
          </div>
        </div>
        <p className="text-xs leading-5 text-white/55">
          Publish or hold evidence and formulary rows. Changes affect Command surfaces. Not medical
          advice.
        </p>
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}
        {loadErrors.length > 0 && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Partial load: {loadErrors.join(' · ')}
          </p>
        )}
        {loading && <p className="text-xs text-white/40">Loading…</p>}
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90">Evidence records ({evidence.length})</h2>
        <ul className="space-y-3">
          {evidence.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
            >
              <div className="font-medium leading-snug">{row.title}</div>
              <div className="mt-1 break-all text-[11px] text-white/45">
                {row.slug} · {row.review_status} · {row.evidence_strength ?? '—'}
                {row.jurisdictions?.length ? ` · ${row.jurisdictions.join(', ')}` : ''}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="min-h-10 flex-1 rounded-lg bg-emerald-700/90 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 sm:flex-none"
                  onClick={() => void setStatus('evidence', row.id, 'published')}
                >
                  Publish
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="min-h-10 flex-1 rounded-lg bg-amber-700/90 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 sm:flex-none"
                  onClick={() => void setStatus('evidence', row.id, 'under-review')}
                >
                  Under review
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="min-h-10 flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white/80 disabled:opacity-50 sm:flex-none"
                  onClick={() => void setStatus('evidence', row.id, 'retired')}
                >
                  Hold / retire
                </button>
              </div>
            </li>
          ))}
          {!loading && evidence.length === 0 && (
            <p className="text-xs text-white/45">No evidence rows loaded.</p>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90">Formulary products ({formulary.length})</h2>
        <ul className="space-y-3">
          {formulary.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
            >
              <div className="font-medium leading-snug">{row.name}</div>
              <div className="mt-1 text-[11px] text-white/45">
                {row.slug} · {row.country_iso2} · {row.authorization_status} · {row.review_status}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="min-h-10 flex-1 rounded-lg bg-emerald-700/90 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 sm:flex-none"
                  onClick={() => void setStatus('formulary', row.id, 'published')}
                >
                  Publish
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="min-h-10 flex-1 rounded-lg bg-amber-700/90 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 sm:flex-none"
                  onClick={() => void setStatus('formulary', row.id, 'under-review')}
                >
                  Under review
                </button>
              </div>
            </li>
          ))}
          {!loading && formulary.length === 0 && (
            <p className="text-xs text-white/45">No formulary rows loaded.</p>
          )}
        </ul>
      </section>

      {skus.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-white/90">SKU snapshot ({skus.length})</h2>
          <ul className="space-y-2 text-[11px] text-white/55">
            {skus.slice(0, 20).map((row) => (
              <li key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                {row.product_name ?? row.id} · {row.country_iso2 ?? '—'} · {row.review_status ?? '—'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
