'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { MobileCommandCentreProps } from '../props'
import { asRecord, readString } from '../contracts'
import { EmptyState, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type Signal = MobileCommandCentreProps['signals'][number]
type PillTone = 'neutral' | 'gold' | 'ok' | 'warn'

type Posture = {
  label: string
  tone: PillTone
}

function humanizeLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function postureFor(signal: Signal): Posture | null {
  const state = signal.decisionRecommendationState
  if (state === 'act_now') return { label: 'Act now', tone: 'warn' }
  if (state === 'investigate') return { label: 'Investigate', tone: 'gold' }
  if (state === 'no_action') return { label: 'No action', tone: 'neutral' }
  if (state === 'monitor') return { label: 'Monitor', tone: 'neutral' }
  return null
}

function signalMarketLabel(signal: Signal): string {
  const primary = readString(signal, ['market', 'jurisdiction', 'country'], '')
  if (primary && !/^(global|unknown|n\/?a)$/i.test(primary)) return primary
  const jurisdictions = Array.isArray(signal.jurisdictions) ? signal.jurisdictions : []
  const first = jurisdictions.find(j => typeof j === 'string' && j.trim())
  return first?.trim() || primary || 'Global'
}

function signalContextMatches(signal: Signal, countryLabel: string) {
  const market = signalMarketLabel(signal)
  if (market && market.localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0) return true
  const jurisdictions = Array.isArray(signal.jurisdictions) ? signal.jurisdictions : []
  return jurisdictions.some(
    j => typeof j === 'string' && j.localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0,
  )
}

function signalConfidence(signal: Signal) {
  const raw = asRecord(signal).confidence
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function formatObserved(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed)
  if (iso) return iso[1]
  return trimmed
}

function clampText(value: string, max = 180) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function resolveTitles(signal: Signal) {
  const item = asRecord(signal)
  const analysis = asRecord(item.analysis)
  const englishTitle =
    readString(item, ['title_en', 'headline_en'], '')
    || readString(item, ['title', 'headline'], 'Untitled signal')

  const candidates = [
    readString(item, [
      'title_original',
      'original_title',
      'headline_original',
      'originalHeadline',
      'title_src',
      'source_title',
      'headline_src',
    ], ''),
    readString(analysis, [
      'original_title',
      'title_original',
      'source_title',
      'headline_original',
      'title_src',
    ], ''),
  ]

  if (item.translated === true) {
    const sourceTitle = readString(item, ['title', 'headline'], '')
    if (sourceTitle) candidates.unshift(sourceTitle)
  }

  let originalLine = ''
  for (const candidate of candidates) {
    if (candidate && candidate !== englishTitle) {
      originalLine = candidate
      break
    }
  }

  return { englishTitle, originalLine }
}

function buildImplication(signal: Signal, englishTitle: string): string {
  const analysis = asRecord(asRecord(signal).analysis)
  const what = readString(analysis, ['what_changed'], '')
  const who = readString(analysis, ['who_is_affected'], '')
  const action = readString(analysis, ['recommended_action'], '')
  const impact = (signal.commercialImpact || '').trim()

  const parts: string[] = []
  if (what) parts.push(what)
  if (who && who.toLowerCase() !== what.toLowerCase()) parts.push(who)
  if (action && !parts.some(p => p.toLowerCase().includes(action.toLowerCase().slice(0, 24)))) {
    parts.push(action)
  }

  let line = parts.join(' · ').trim()
  if (!line && impact && impact !== englishTitle) line = impact
  if (!line) return ''
  return clampText(line, 200)
}

function buildMetaChips(signal: Signal): string[] {
  const chips: string[] = []
  const confidence = signalConfidence(signal)
  if (confidence != null) chips.push(`${confidence}% confidence`)

  const source = readString(signal, ['sourceName', 'source_name', 'sourceLabel', 'source_label'], '')
  if (source) chips.push(source)

  const observed = formatObserved(
    readString(signal, ['publishedAt', 'published_at', 'observed_at', 'updated_at', 'timeAgo'], ''),
  )
  if (observed) chips.push(observed)

  const corr = asRecord(signal).corroborationCount ?? asRecord(signal).corroboration_count
  if (typeof corr === 'number' && corr > 1 && chips.length < 3) {
    chips.push(`${Math.round(corr)} sources`)
  }

  if (asRecord(signal).translated === true && chips.length < 3) {
    const lang = readString(asRecord(signal), ['originalLanguageLabel', 'original_language_label'], '')
    chips.push(lang ? `via ${lang}` : 'Translated')
  }

  return chips.slice(0, 3)
}

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
      eyebrow="Intel"
      title="Weekly signals"
      description="Jurisdiction matches first. Open a dossier for evidence and unknowns."
    >
      {orderedSignals.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label="Decision intelligence events">
          {orderedSignals.map(({ signal, contextual }, listIndex) => {
            const { englishTitle, originalLine } = resolveTitles(signal)
            const implication = buildImplication(signal, englishTitle)
            const summaryFallback = !implication
              ? clampText(
                  signal.summary
                  || (signal.commercialImpact && signal.commercialImpact !== englishTitle
                    ? signal.commercialImpact
                    : ''),
                  180,
                )
              : ''
            const market = signalMarketLabel(signal)
            const meta = buildMetaChips(signal)
            const posture = postureFor(signal)
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
            const typeRaw = readString(signal, ['type', 'tag.label'], '')
            const typeLabel = typeRaw ? humanizeLabel(typeRaw) : ''

            const article = (
              <article className={`hvm2-intel-signal-card${isPrimary ? ' hvm2-intel-primary' : ''}`}>
                <div className="hvm2-card-topline">
                  <div className="hvm2-intel-topline-left">
                    {posture ? (
                      <StatusPill tone={posture.tone}>{posture.label}</StatusPill>
                    ) : typeLabel ? (
                      <StatusPill>{typeLabel}</StatusPill>
                    ) : null}
                    {!contextual ? (
                      <StatusPill tone="neutral">Broader watch</StatusPill>
                    ) : null}
                  </div>
                  <span className="hvm2-intel-market">{market}</span>
                </div>

                <h3>{englishTitle}</h3>
                {originalLine ? <p className="hvm2-intel-original">{originalLine}</p> : null}

                {implication ? (
                  <p className="hvm2-intel-implication">{implication}</p>
                ) : summaryFallback ? (
                  <p className="hvm2-intel-summary">{summaryFallback}</p>
                ) : null}

                {meta.length > 0 ? (
                  <div className="hvm2-intel-meta-row" aria-label="Signal metadata">
                    {meta.map(bit => <span key={bit}>{bit}</span>)}
                  </div>
                ) : null}

                {hasDossier ? (
                  <div className="hvm2-signal-footer">
                    <strong className="hvm2-intel-cta">
                      {canOpenDossiers ? 'Open dossier →' : 'Upgrade to Intel →'}
                    </strong>
                  </div>
                ) : null}
              </article>
            )

            const key = readString(signal, ['id'], `${market}-${englishTitle}`)
            if (dossierHref) {
              return (
                <Link
                  className="hvm2-intel-event-link"
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
            return <div className="hvm2-intel-event-link" key={key}>{article}</div>
          })}
        </div>
      ) : (
        <EmptyState
          title="No reviewed signals for this context"
          detail="Nothing is loaded for the active jurisdiction yet. Switch market, or wait for the next reviewed promotion cycle."
        />
      )}
    </SectionShell>
  )
}
