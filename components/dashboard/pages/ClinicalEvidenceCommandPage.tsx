'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { AskClinicalResponse } from '@/lib/clinical/prescriber'
import type { ClinicalPrescriberWorkspaceDTO, ClinicalProfessionalAuthorityDTO } from '@/lib/clinical/workspace'

export type ClinicalEvidenceCommandPageProps = {
  countryLabel: string
  countryIso2?: string | null
  roleLabel?: string
}

const panel = 'rounded-xl border border-white/10 bg-[#141922] p-4'

function resolvedJurisdiction(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? ''
  return /^[A-Z]{2}(?:-[A-Z0-9]{2,3})?$/.test(normalized) && normalized !== 'GLOBAL' ? normalized : null
}

function statusLabel(authority: ClinicalProfessionalAuthorityDTO | null): string {
  if (!authority) return 'Checking professional authority'
  if (authority.state === 'loaded') return 'Authority resolved'
  if (authority.state === 'permission') return 'Verified clinician access required'
  if (authority.state === 'unknown') return 'Authority unresolved'
  return 'Authority source unavailable'
}

function clinicalSectionHref(jurisdiction: string, roleLabel: string, q?: string) {
  const params = new URLSearchParams({
    section: 'clinical',
    page: 'clinical',
    country: jurisdiction,
  })
  if (roleLabel) params.set('role', roleLabel)
  if (q) params.set('q', q)
  return `/dashboard?${params.toString()}`
}

export default function ClinicalEvidenceCommandPage({
  countryLabel,
  countryIso2 = null,
  roleLabel = '',
}: ClinicalEvidenceCommandPageProps) {
  const jurisdiction = useMemo(() => resolvedJurisdiction(countryIso2), [countryIso2])
  const [summary, setSummary] = useState<ClinicalPrescriberWorkspaceDTO | null>(null)
  const [summaryError, setSummaryError] = useState(false)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<AskClinicalResponse | null>(null)
  const [loadingAnswer, setLoadingAnswer] = useState(false)

  useEffect(() => {
    setSummary(null)
    setSummaryError(false)
    setAnswer(null)
    setQuery('')
    if (!jurisdiction) return
    const controller = new AbortController()
    void fetch(`/api/clinical/workspace?jurisdiction=${encodeURIComponent(jurisdiction)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as ClinicalPrescriberWorkspaceDTO | null
        if (body) setSummary(body)
        else setSummaryError(true)
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setSummaryError(true)
      })
    return () => controller.abort()
  }, [jurisdiction])

  async function askClinical(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = query.trim()
    if (!jurisdiction || question.length < 2) return
    setLoadingAnswer(true)
    setAnswer(null)
    try {
      const params = new URLSearchParams({ q: question, jurisdiction, limit: '8' })
      const response = await fetch(`/api/clinical/ask?${params}`, { cache: 'no-store' })
      const body = await response.json() as AskClinicalResponse
      setAnswer(body)
    } catch {
      setAnswer({
        state: 'error',
        question,
        answer: 'The governed clinical evidence source is unavailable.',
        citations: [],
        unresolved: ['Retry before relying on this decision surface.'],
      })
    } finally {
      setLoadingAnswer(false)
    }
  }

  if (!jurisdiction) {
    return (
      <div className="space-y-4">
        <section className={panel} data-testid="clinical-command-context-required">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Clinical decision surface</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Jurisdiction required</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Clinical will not substitute Brazil, Canada, or another jurisdiction. Select a specific country in the Command context before professional authority, evidence, products, or safety are evaluated.
          </p>
        </section>
      </div>
    )
  }

  const workspaceHref = clinicalSectionHref(jurisdiction, roleLabel)
  const authority = summary?.authority ?? null
  const safetyCount = summary?.safety.length ?? 0
  const interactionCount = summary?.interactions.length ?? 0
  const productCount = summary?.formulary.length ?? 0

  return (
    <div className="space-y-4" data-testid="clinical-command-decision-surface">
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Clinical decision surface</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{countryLabel} · Prescriber status</h2>
            <p className="mt-1 text-sm text-white/55">{roleLabel || 'Professional role unresolved'} · {jurisdiction}</p>
          </div>
          <Link href={workspaceHref} className="rounded-lg border border-[#d4a853]/45 bg-[#d4a853]/10 px-3 py-2 text-xs font-semibold text-[#e4be6a]">
            Open Clinical section →
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Authority</p>
            <p className="mt-1 text-sm font-medium text-white/85">{statusLabel(authority)}</p>
            <p className="mt-1 text-xs text-white/45">{authority?.professional?.role ?? 'No authority inference from Command role.'}</p>
          </article>
          <article className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Safety</p>
            <p className="mt-1 text-sm font-medium text-white/85">{summary ? `${safetyCount} structured rule${safetyCount === 1 ? '' : 's'}` : summaryError ? 'Unavailable' : 'Checking…'}</p>
            <p className="mt-1 text-xs text-white/45">Safety classification uses governed structured fields.</p>
          </article>
          <article className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Interactions</p>
            <p className="mt-1 text-sm font-medium text-white/85">{summary ? `${interactionCount} inspectable record${interactionCount === 1 ? '' : 's'}` : summaryError ? 'Unavailable' : 'Checking…'}</p>
            <p className="mt-1 text-xs text-white/45">Production fixtures cannot mask an empty/error state.</p>
          </article>
          <article className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Products</p>
            <p className="mt-1 text-sm font-medium text-white/85">{summary ? `${productCount} formulary record${productCount === 1 ? '' : 's'}` : summaryError ? 'Unavailable' : 'Checking…'}</p>
            <p className="mt-1 text-xs text-white/45">Open Clinical section for product/regimen detail.</p>
          </article>
        </div>

        {summary?.state === 'review-required' && (
          <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/8 p-3 text-xs leading-5 text-amber-100/80">
            Some Clinical records are withheld pending prescriber-inspectable provenance review.
          </div>
        )}
      </section>

      <section className={panel}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">Explicit clinical question</p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={askClinical}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter a condition or clinical question"
            aria-label="Clinical question"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d4a853]/55"
          />
          <button
            type="submit"
            disabled={loadingAnswer || query.trim().length < 2}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 disabled:opacity-40"
          >
            {loadingAnswer ? 'Checking…' : 'Check evidence'}
          </button>
        </form>
        {!answer && !loadingAnswer && (
          <p className="mt-3 text-xs leading-5 text-white/45">No evidence answer is generated before you submit a clinical question. The complete Decision, Evidence, Safety, Products, Regimen, Monitoring, Guidelines, Documentation and History experience remains in the Clinical Command section.</p>
        )}
        {answer && (
          <div className="mt-3 rounded-lg border border-white/8 bg-white/[0.025] p-3" data-testid="clinical-command-answer">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Governed evidence · {answer.state}</p>
              <Link href={clinicalSectionHref(jurisdiction, roleLabel, answer.question)} className="text-xs text-[#d4a853]">Inspect in Clinical section →</Link>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/75">{answer.answer}</p>
            {answer.citations.length > 0 && (
              <p className="mt-2 text-xs text-white/45">{answer.citations.length} inspectable source citation{answer.citations.length === 1 ? '' : 's'} available in Clinical section.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
