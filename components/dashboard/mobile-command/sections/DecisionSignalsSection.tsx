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
  return bits
}

function clampText(value: string, max = 220) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

/**
 * Canonical mobile signal list after layout cleanup.
 * Feed cards are lean decision surfaces; deep evidence lives in the dossier.
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
          {orderedSignals.map(({ signal, contextual }, listIndex) => {
            const analysis = asRecord(asRecord(signal).analysis)
            const englishTitle = readString(signal, ['title_en', 'headline_en'], '')
              || readString(signal, ['title'], 'Untitled signal')
            const originalLine = readString(signal, [
              'title_original',
              'original_title',
              'headline_original',
              'title_src',
              'headline',
            ], '')
            const showOriginal = Boolean(
              originalLine
              && originalLine !== englishTitle
              && originalLine !== readString(signal, ['title'], ''),
            )
            const summaryRaw = signal.summary
              || readString(analysis, ['what_changed'], '')
              || (signal.commercialImpact && signal.commercialImpact !== englishTitle ? signal.commercialImpact : '')
            const summary = summaryRaw ? clampText(summaryRaw) : ''
            const market = readString(signal, ['market', 'jurisdiction', 'country'], 'Global')
            const confidence = signalConfidence(signal)
            const evidence = signalEvidence(signal)
            const quality = signalQualityBits(signal)
            const isEditorial = signal.contentType === 'editorial'
            const isPublishedDigest = signal.sourceLabel === 'Harbourview Daily'
            const isLegacyStory = signal.signalContentType === 'story' || signal.signalContentType === 'research'
            const canSynthesizeLegacyRoute = !isEditorial && !isPublishedDigest && !isLegacyStory
            const dossierEventId = signal.decisionIntelEventId
              ?? (canSynthesizeLegacyRoute && signal.id ? `event:${signal.id}` : undefined)
            const hasDossier = Boolean(dossierEventId)
            const dossierHref = hasDossier
              ? `/dashboard/intel/events/${encodeURIComponent(dossierEventId!)}?returnTo=${encodeURIComponent(returnTo)}`
              : null
            const isPrimary = listIndex === 0

            const article = (
              <article className={`hvm2-intel-signal-card${isPrimary ? ' hvm2-intel-primary' : ''}`}>
                <div className="hvm2-card-topline">
                  <StatusPill>{hasDossier ? recommendationLabel(signal) : readString(signal, ['type'], 'Signal')}</StatusPill>
                  <span>{market}</span>
                </div>
                <div className="hvm2-intel-context-row">
                  <StatusPill tone={contextual ? 'ok' : 'neutral'}>{contextual ? 'Context match' : 'Broader watch'}</StatusPill>
                  {!contextual ? (
                    <small>No direct {countryLabel} match is recorded in this signal's jurisdiction metadata.</small>
                  ) : null}
                </div>
                <h3>{englishTitle}</h3>
                {showOriginal ? <p className="hvm2-intel-original">{originalLine}</p> : null}
                {summary ? <p className="hvm2-intel-summary">{summary}</p> : null}
                <div className="hvm2-intel-meta-row">
                  {confidence != null ? <span>Confidence {confidence}%</span> : <span>Confidence Unknown</span>}
                  {quality.map(bit => <span key={bit}>{bit}</span>)}
                  {evidence.source ? <span>Source {evidence.source}</span> : <span>Source Unknown</span>}
                  {evidence.observed ? <span>{evidence.observed}</span> : null}
                </div>
                {hasDossier ? (
                  <div className="hvm2-signal-footer">
                    <strong>{canOpenDossiers ? 'Open dossier →' : 'Upgrade to Intel →'}</strong>
                  </div>
                ) : null}
              </article>
            )

            const key = readString(signal, ['id'], `${market}-${englishTitle}`)
            if (dossierHref) {
              return (
                <Link
                  className="hvm2-signal-card hvm2-intel-event-row"
                  key={key}
                  href={canOpenDossiers ? dossierHref : '/account/upgrade'}
                  aria-label={
                    canOpenDossiers
                      ? `Open intelligence dossier: ${englishTitle}`
                      : `Upgrade to Intel to open intelligence dossier: ${englishTitle}`
                  }
                >
                  {article}
                </Link>
              )
            }
            return <div className="hvm2-signal-card hvm2-intel-event-row" key={key}>{article}</div>
          })}
        </div>
      ) : (
        <EmptyState
          title="No reviewed signals loaded"
          detail="The intelligence surface is available, but no current signal records are loaded for review."
        />
      )}
    </SectionShell>
  )
}
