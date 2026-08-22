'use client'

import { useCallback, useEffect, useState } from 'react'

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

export default function ClinicalReviewAdminPage() {
  const [evidence, setEvidence] = useState<EvidenceRow[]>([])
  const [formulary, setFormulary] = useState<FormularyRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/clinical/admin/review?entity=both')
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? `Status ${res.status}`)
      return
    }
    const data = await res.json()
    setEvidence(data.evidence ?? [])
    setFormulary(data.formulary ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(
    entity: 'evidence' | 'formulary',
    id: string,
    review_status: 'published' | 'under-review' | 'retired',
  ) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch('/api/clinical/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id, review_status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? `Status ${res.status}`)
        return
      }
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 text-sm">
      <header>
        <div className="mb-2 flex flex-wrap gap-3 text-xs">
          <a href="/admin/hub" className="text-neutral-500 hover:underline">← Admin hub</a>
          <a href="/admin/clinical-review/claim-map" className="text-neutral-500 hover:underline">
            Claim map &amp; framework gaps →
          </a>
        </div>
        <h1 className="text-xl font-semibold">Clinical review queue</h1>
        <p className="mt-1 text-neutral-500">
          Publish or retire evidence and formulary rows. Not medical advice. Changes affect public Command surfaces.
        </p>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </header>

      <section>
        <h2 className="mb-3 font-medium">Evidence records</h2>
        <ul className="space-y-3">
          {evidence.map((row) => (
            <li key={row.id} className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
              <div className="font-medium">{row.title}</div>
              <div className="text-xs text-neutral-500">
                {row.slug} · {row.review_status} · {row.evidence_strength ?? '—'}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                  onClick={() => void setStatus('evidence', row.id, 'published')}
                >
                  Publish
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="rounded bg-amber-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                  onClick={() => void setStatus('evidence', row.id, 'under-review')}
                >
                  Under review
                </button>
              </div>
            </li>
          ))}
          {evidence.length === 0 && <p className="text-neutral-500">No evidence rows loaded.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Formulary products</h2>
        <ul className="space-y-3">
          {formulary.map((row) => (
            <li key={row.id} className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
              <div className="font-medium">{row.name}</div>
              <div className="text-xs text-neutral-500">
                {row.country_iso2} · {row.authorization_status} · {row.review_status}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                  onClick={() => void setStatus('formulary', row.id, 'published')}
                >
                  Publish
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="rounded bg-amber-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                  onClick={() => void setStatus('formulary', row.id, 'under-review')}
                >
                  Under review
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  className="rounded bg-neutral-700 px-2 py-1 text-xs text-white disabled:opacity-50"
                  onClick={() => void setStatus('formulary', row.id, 'retired')}
                >
                  Retire
                </button>
              </div>
            </li>
          ))}
          {formulary.length === 0 && <p className="text-neutral-500">No formulary rows loaded.</p>}
        </ul>
      </section>
    </div>
  )
}
