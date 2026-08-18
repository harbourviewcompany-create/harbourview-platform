'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { MobileCommandCentreProps } from '../props'
import { asRecord, readString } from '../contracts'
import { EmptyState, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type Signal = MobileCommandCentreProps['signals'][number]

function recommendationLabel(signal: Signal) {
  const state = signal.decisionRecommendationState
  if (state === 'act_now') return 'Act now'
  if (state === 'investigate') return 'Investigate'
  if (state === 'no_action') return 'No action'
  if (state === 'monitor') return 'Monitor'
  return 'Open dossier'
}

function signalContextMatches(signal: Signal, countryLabel: string) {
  const market = readString(signal, ['market', 'jurisdiction', 'country'], '')
  return Boolean(market && market.localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0)
}

function signalConfidence(signal: Signal) {
  const raw = asRecord(signal).confidence
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function signalEvidence(signal: Signal) {
  const source = readString(signal, ['sourceName', 'source_name', 'sourceLabel', 'source_label'], '')
  const observed = readString(signal, ['publishedAt', 'published_at', 'observed_at', 'updated_at', 'timeAgo'], '')
  return { source, observed }
}

function signalQualityBits(signal: Signal): string[] {
  const item = asRecord(signal)
  const bits: string[] = []
  const corr = item.corroborationCount ?? item.corroboration_count
  if (typeof corr === 'number' && corr > 1) bits.push(`${Math.round(corr)} sources`)
  if (item.translated === true) {
    const lang = readString(item, ['originalLanguageLabel', 'original_language_label'], '')
    bits.push(lang ? `via ${lang}` : 'Translated')
  }
  if (signal.verificationStatus) bits.push(`Verification ${signal.verificationStatus}`)
  return bits
}

function displayList(label: string, values?: string[]) {
  if (!values?.length) return null
  return <p><strong>{label}:</strong> {values.join(' · ')}</p>
}

function imageStatusLabel(status?: string) {
  if (!status || status === 'not_applicable') return ''
  if (status === 'source_page_contains_image_not_ingested') return 'Image available at source'
  if (status === 'not_captured') return 'Image not captured'
  return status.replace(/_/g, ' ')
}

/**
 * Canonical mobile signal renderer after the #1402 reconciliation.
 * Keeps Decision Intelligence dossier routing from current main while exposing
 * only the explicit authenticated presentation fields projected by
 * /api/dashboard/signals. Raw analysis/provenance payloads are never rendered.
 */
export function WeeklySignalsSection({ sectionRef, signals, countryLabel, access }: {
  sectionRef: SectionRef
  signals: Signal[]
  countryLabel: string
  access?: FeatureAccess
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const returnTo = `${pathname}${query ? `?${query}` : ''}`
  const canOpenDossiers = access?.granted === true
  const orderedSignals = useMemo(
    () => signals
      .map((signal, index) => ({ signal, index, contextual: signalContextMatches(signal, countryLabel) }))
      .sort((a, b) => Number(b.contextual) - Number(a.contextual) || a.index - b.index),
    [countryLabel, signals],
  )

  return (
    <SectionShell
      id="weekly-signals"
      sectionRef={sectionRef}
      eyebrow="Intel / material changes"
      title="Intelligence requiring a decision"
      description="Jurisdiction matches for the active context appear first. Open supported events for evidence, unknowns and a reasoned decision posture."
    >
      {orderedSignals.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label="Decision intelligence events">
          {orderedSignals.map(({ signal, contextual }) => {
            const analysis = asRecord(asRecord(signal).analysis)
            const whatChanged = signal.summary
              || readString(analysis, ['what_changed'], readString(signal, ['commercialImpact', 'commercial_impact'], ''))
            const recommendedAction = readString(analysis, ['recommended_action'], '')
            const market = readString(signal, ['market', 'jurisdiction', 'country'], 'Global')
            const confidence = signalConfidence(signal)
            const evidence = signalEvidence(signal)
            const quality = signalQualityBits(signal)
            const imageStatus = imageStatusLabel(signal.image?.status)
            const hasSafeEvidenceDetails = Boolean(
              signal.jurisdictions?.length
              || signal.counterparties?.length
              || signal.facilities?.length
              || signal.licencesCertifications?.length
              || signal.products?.length
              || signal.marketAccess?.length
              || signal.verifiedFacts?.length
              || signal.inferences?.length
              || signal.transactionStage
              || imageStatus,
            )
            const isEditorial = signal.contentType === 'editorial'
            const isPublishedDigest = signal.sourceLabel === 'Harbourview Daily'
            const isLegacyStory = signal.signalContentType === 'story' || signal.signalContentType === 'research'
            const canSynthesizeLegacyRoute = !isEditorial && !isPublishedDigest && !isLegacyStory
            const dossierEventId = signal.decisionIntelEventId ?? (canSynthesizeLegacyRoute && signal.id ? `event:${signal.id}` : undefined)
            const hasDossier = Boolean(dossierEventId)
            const dossierHref = hasDossier
              ? `/dashboard/intel/events/${encodeURIComponent(dossierEventId!)}?returnTo=${encodeURIComponent(returnTo)}`
              : null

            const article = (
              <article className="hvm2-intel-signal-card">
                <div className="hvm2-card-topline">
                  <StatusPill>{hasDossier ? recommendationLabel(signal) : readString(signal, ['type'], 'Signal')}</StatusPill>
                  <span>{market}</span>
                </div>
                <div className="hvm2-intel-context-row">
                  <StatusPill tone={contextual ? 'ok' : 'neutral'}>{contextual ? 'Context match' : 'Broader watch'}</StatusPill>
                  {!contextual ? <small>No direct {countryLabel} match is recorded in this signal&apos;s jurisdiction metadata.</small> : null}
                </div>
                <h3>{readString(signal, ['title_en', 'headline_en', 'title'], 'Untitled signal')}</h3>
                {whatChanged ? <p>{whatChanged}</p> : <p className="hvm2-intel-unknown">Change summary not recorded in the loaded signal.</p>}
                <div className="hvm2-intel-meta-row">
                  {confidence != null ? <span>Confidence {confidence}%</span> : <span>Confidence Unknown</span>}
                  {quality.map(bit => <span key={bit}>{bit}</span>)}
                  {evidence.source ? <span>Source {evidence.source}</span> : <span>Source Unknown</span>}
                  {evidence.observed ? <span>{evidence.observed}</span> : null}
                </div>
                {signal.commercialImpact && signal.commercialImpact !== whatChanged ? (
                  <div className="hvm2-intel-action"><span>Commercial implication</span><p>{signal.commercialImpact}</p></div>
                ) : null}
                {recommendedAction ? <div className="hvm2-intel-action"><span>Action</span><p>{recommendedAction}</p></div> : null}
                {hasSafeEvidenceDetails ? (
                  <div className="hvm2-note hvm2-signal-evidence-details" aria-label="Evidence and market-access details">
                    {signal.transactionStage ? <p><strong>Stage:</strong> {signal.transactionStage}</p> : null}
                    {displayList('Jurisdictions', signal.jurisdictions)}
                    {displayList('Counterparties', signal.counterparties)}
                    {displayList('Facilities', signal.facilities)}
                    {displayList('Licences / certifications', signal.licencesCertifications)}
                    {displayList('Products', signal.products)}
                    {displayList('Market access', signal.marketAccess)}
                    {imageStatus ? <p><strong>Image:</strong> {imageStatus}</p> : null}
                    {displayList('Verified facts', signal.verifiedFacts)}
                    {displayList('Inference', signal.inferences)}
                  </div>
                ) : null}
                {hasDossier ? <div className="hvm2-signal-footer"><strong>{canOpenDossiers ? 'Open dossier →' : 'Upgrade to Intel →'}</strong></div> : null}
              </article>
            )

            const key = readString(signal, ['id'], `${market}-${readString(signal, ['title'], 'signal')}`)
            if (dossierHref) {
              return (
                <Link
                  className="hvm2-signal-card hvm2-intel-event-row"
                  key={key}
                  href={canOpenDossiers ? dossierHref : '/account/upgrade'}
                  aria-label={canOpenDossiers ? `Open intelligence dossier: ${readString(signal, ['title'], 'signal')}` : `Upgrade to Intel to open intelligence dossier: ${readString(signal, ['title'], 'signal')}`}
                  style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
                >
                  {article}
                </Link>
              )
            }
            return <div className="hvm2-signal-card hvm2-intel-event-row" key={key}>{article}</div>
          })}
        </div>
      ) : (
        <EmptyState title="No reviewed signals loaded" detail="The intelligence surface is available, but no current signal records are loaded for review." />
      )}
    </SectionShell>
  )
}
