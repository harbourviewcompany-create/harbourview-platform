import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/require-auth'
import { LEGACY_REVIEW_VERIFICATION_NOTICE } from '@/lib/intelligence-os/complianceCopy'
import { loadDecisionIntelDossier } from '@/lib/intelligence-os/decisionDossier'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function labelState(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not established'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function safeReturnTo(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || !candidate.startsWith('/dashboard') || candidate.startsWith('//')) return '/dashboard?section=weekly-signals'
  return candidate
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a45a]">{title}</h2>
      {children}
    </section>
  )
}

export default async function DecisionIntelEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string | string[] }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  await requireAuth('signals')
  // requireAuth's client intentionally uses Supabase's default schema. Harbourview's
  // production Data API is exposed through `api`, so use the canonical server client
  // for dossier reads after the entitlement gate has succeeded.
  const supabase = await createClient()
  const dossier = await loadDecisionIntelDossier(supabase, decodeURIComponent(id))
  if (!dossier) notFound()

  const confidenceLabel = dossier.confidence == null ? 'Not scored' : `${Math.round(dossier.confidence * 100)}%`
  const backHref = safeReturnTo(query.returnTo)
  const jurisdictionHref = dossier.jurisdictionIso2
    ? `/dashboard?page=countries&country=${encodeURIComponent(dossier.jurisdictionIso2)}`
    : null

  return (
    <main className="min-h-screen bg-[#07101b] px-4 pb-16 pt-5 text-[#f4f0e8] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href={backHref} className="mb-5 inline-flex text-sm text-[#c5a45a] hover:underline">← Back to Intel</Link>

        <header className="mb-6 rounded-3xl border border-white/10 bg-[#0b1725] p-5 sm:p-7">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
            <span className="rounded-full border border-[#c5a45a]/40 bg-[#c5a45a]/10 px-3 py-1 text-[#d7bd7a]">{labelState(dossier.recommendationState)}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">{labelState(dossier.eventType)}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">{labelState(dossier.materiality)} materiality</span>
          </div>
          <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-4xl">{dossier.headline}</h1>
          {dossier.summary ? <p className="mt-4 max-w-4xl text-base leading-7 text-white/70">{dossier.summary}</p> : null}
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <span className="block text-white/45">Jurisdiction</span>
              {jurisdictionHref ? (
                <Link href={jurisdictionHref} className="font-semibold text-[#d7bd7a] hover:underline">
                  {dossier.jurisdictionLabel ?? dossier.jurisdictionIso2}
                </Link>
              ) : <strong>{dossier.jurisdictionLabel ?? 'Global / unresolved'}</strong>}
            </div>
            <div><span className="block text-white/45">Evidence</span><strong>{dossier.sourceCount} source{dossier.sourceCount === 1 ? '' : 's'}</strong></div>
            <div><span className="block text-white/45">Confidence</span><strong>{confidenceLabel}</strong></div>
            <div><span className="block text-white/45">Review state</span><strong>{labelState(dossier.reviewStatus)}</strong></div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="What happened"><p className="leading-7 text-white/85">{dossier.whatHappened}</p></Section>
          <Section title="What changed"><p className="leading-7 text-white/85">{dossier.whatChanged ?? 'A specific previous → current delta has not yet been established.'}</p></Section>
          <Section title="Why it matters"><p className="leading-7 text-white/85">{dossier.whyItMatters ?? 'Material consequence requires further contextual assessment.'}</p></Section>
          <Section title="Why now"><p className="leading-7 text-white/85">{dossier.whyNow ?? 'No time-specific catalyst has been verified yet.'}</p></Section>
          <Section title="Commercial implications"><p className="leading-7 text-white/85">{dossier.commercialImplications ?? 'No verified commercial implication recorded.'}</p></Section>
          <Section title="Regulatory implications"><p className="leading-7 text-white/85">{dossier.regulatoryImplications ?? 'No separate regulatory implication has been established.'}</p></Section>
        </div>

        <section className="mt-4 rounded-3xl border border-[#c5a45a]/35 bg-[#c5a45a]/[0.07] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7bd7a]">Recommended posture</p>
              <h2 className="mt-1 text-2xl font-semibold">{labelState(dossier.recommendationState)}</h2>
            </div>
            <span className="rounded-full border border-[#c5a45a]/30 px-3 py-1 text-xs uppercase tracking-wider text-[#d7bd7a]">{labelState(dossier.urgency)} urgency</span>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-white/80">{dossier.recommendationReasoning}</p>
          {dossier.actionSummary ? <p className="mt-3 border-l-2 border-[#c5a45a] pl-4 text-sm text-white/75"><strong className="text-white">Proposed next action:</strong> {dossier.actionSummary}</p> : null}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Section title="Affected context">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-white/45">Entities</dt><dd className="mt-1 text-white/85">{dossier.affectedEntities.join(' · ') || 'Not yet resolved'}</dd></div>
              <div><dt className="text-white/45">Markets</dt><dd className="mt-1 text-white/85">{dossier.affectedMarkets.join(' · ') || dossier.jurisdictionLabel || 'Not yet resolved'}</dd></div>
              <div><dt className="text-white/45">Products</dt><dd className="mt-1 text-white/85">{dossier.affectedProducts.join(' · ') || 'Not yet resolved'}</dd></div>
            </dl>
          </Section>
          <Section title="Timing">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-white/45">Occurred</dt><dd className="mt-1">{formatDate(dossier.occurredAt)}</dd></div>
              <div><dt className="text-white/45">Detected</dt><dd className="mt-1">{formatDate(dossier.detectedAt)}</dd></div>
              <div><dt className="text-white/45">Effective</dt><dd className="mt-1">{formatDate(dossier.effectiveAt)}</dd></div>
              <div><dt className="text-white/45">Last verified</dt><dd className="mt-1">{formatDate(dossier.lastVerifiedAt)}</dd></div>
            </dl>
          </Section>
          <Section title="Confidence rationale"><p className="leading-7 text-white/80">{dossier.confidenceRationale ?? 'Confidence is inherited from upstream quality classification; analytical confidence has not yet been independently decomposed.'}</p></Section>
          <Section title="Unknowns">
            {dossier.unknowns.length ? <ul className="space-y-2 text-sm leading-6 text-white/80">{dossier.unknowns.map(item => <li key={item}>• {item}</li>)}</ul> : <p className="text-white/65">No explicit gap recorded.</p>}
          </Section>
          <Section title="Contradictions">
            {dossier.contradictions.length ? <ul className="space-y-2 text-sm leading-6 text-white/80">{dossier.contradictions.map(item => <li key={item}>• {item}</li>)}</ul> : <p className="text-white/65">No contradictory evidence is linked to this dossier.</p>}
          </Section>
          <Section title="Evidence">
            {dossier.evidence.length ? (
              <ul className="space-y-3">
                {dossier.evidence.map((item, index) => (
                  <li key={`${item.sourceUrl ?? item.sourceLabel ?? 'evidence'}-${index}`} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="block text-sm">{item.sourceLabel ?? 'Source evidence'}</strong>
                        <span className="text-xs text-white/45">{labelState(item.relationship)} · {labelState(item.status)} · {formatDate(item.observedAt)}</span>
                      </div>
                      {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-[#d7bd7a] hover:underline">Open source ↗</a> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-white/65">No inspectable evidence reference is available yet. This is an explicit intelligence gap, not proof that no source exists.</p>}
          </Section>
        </div>

        <p className="mt-6 text-xs leading-5 text-white/35">Event {dossier.id} · consolidation {labelState(dossier.consolidationStatus)}. {LEGACY_REVIEW_VERIFICATION_NOTICE}</p>
      </div>
    </main>
  )
}
