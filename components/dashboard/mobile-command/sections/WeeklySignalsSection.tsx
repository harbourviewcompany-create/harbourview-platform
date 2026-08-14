'use client'

import { useMemo } from 'react'
import type { MobileCommandCentreProps } from '../props'
import { EmptyState, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type Signal = MobileCommandCentreProps['signals'][number]

function signalContextMatches(signal: Signal, countryLabel: string) {
  return Boolean(signal.market && signal.market.localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0)
}

function formatList(values?: string[]) {
  return values?.filter(Boolean).join(' · ') || ''
}

function imageStatusLabel(status?: string) {
  if (!status || status === 'not_applicable') return ''
  if (status === 'source_page_contains_image_not_ingested') return 'Image available at source'
  if (status === 'not_captured') return 'Image not captured'
  return status.replace(/_/g, ' ')
}

export function WeeklySignalsSection({ sectionRef, signals, countryLabel }: {
  sectionRef: SectionRef
  signals: Signal[]
  countryLabel: string
}) {
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
      eyebrow="Context / weekly signals"
      title="Intelligence requiring attention"
      description="Jurisdiction matches for the active context appear first; broader-watch items remain reviewable below."
    >
      {orderedSignals.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label="Weekly intelligence signals">
          {orderedSignals.map(({ signal, contextual }) => {
            const source = signal.sourceLabel || ''
            const observed = signal.publishedAt || signal.timeAgo || ''
            const summary = signal.summary || signal.analysis?.what_changed || signal.commercialImpact || ''
            const verification = signal.verificationStatus || ''
            const imageStatus = imageStatusLabel(signal.image?.status)
            const hasDetails = Boolean(
              signal.counterparties?.length
              || signal.facilities?.length
              || signal.licencesCertifications?.length
              || signal.products?.length
              || signal.marketAccess?.length
              || signal.verifiedFacts?.length
              || signal.inferences?.length
              || signal.transactionStage
              || imageStatus,
            )

            return (
              <article className="hvm2-signal-card hvm2-intel-signal-card" key={signal.id}>
                <div className="hvm2-card-topline">
                  <StatusPill>{signal.type || 'Signal'}</StatusPill>
                  <span>{signal.market || 'Global'}</span>
                </div>

                <div className="hvm2-intel-context-row">
                  <StatusPill tone={contextual ? 'ok' : 'neutral'}>{contextual ? 'Context match' : 'Broader watch'}</StatusPill>
                  {!contextual ? <small>No direct {countryLabel} match is recorded in this signal&apos;s jurisdiction metadata.</small> : null}
                </div>

                <h3>{signal.title || 'Untitled signal'}</h3>
                {summary ? <p>{summary}</p> : <p className="hvm2-intel-unknown">Change summary not recorded in the loaded signal.</p>}

                <div className="hvm2-intel-meta-row">
                  <span>Confidence {Math.max(0, Math.min(100, Math.round(signal.confidence)))}%</span>
                  {verification ? <span>Verification {verification}</span> : null}
                  {signal.corroborationCount && signal.corroborationCount > 1 ? <span>{signal.corroborationCount} sources</span> : null}
                  {signal.translated ? <span>{signal.originalLanguageLabel ? `via ${signal.originalLanguageLabel}` : 'Translated'}</span> : null}
                  {source ? <span>Source {source}</span> : <span>Source Unknown</span>}
                  {observed ? <span>{observed}</span> : null}
                </div>

                {signal.commercialImpact && signal.commercialImpact !== summary ? (
                  <div className="hvm2-intel-action">
                    <span>Commercial implication</span>
                    <p>{signal.commercialImpact}</p>
                  </div>
                ) : null}

                {signal.sourceUrl ? (
                  <p><a className="hvm2-text-link" href={signal.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a></p>
                ) : null}

                {hasDetails ? (
                  <details className="hvm2-note hvm2-signal-evidence-details">
                    <summary>Evidence and market-access details</summary>
                    {signal.transactionStage ? <p><strong>Stage:</strong> {signal.transactionStage}</p> : null}
                    {signal.counterparties?.length ? <p><strong>Counterparties:</strong> {formatList(signal.counterparties)}</p> : null}
                    {signal.facilities?.length ? <p><strong>Facilities:</strong> {formatList(signal.facilities)}</p> : null}
                    {signal.licencesCertifications?.length ? <p><strong>Licences / certifications:</strong> {formatList(signal.licencesCertifications)}</p> : null}
                    {signal.products?.length ? <p><strong>Products:</strong> {formatList(signal.products)}</p> : null}
                    {signal.marketAccess?.length ? <p><strong>Market access:</strong> {formatList(signal.marketAccess)}</p> : null}
                    {imageStatus ? <p><strong>Image:</strong> {imageStatus}</p> : null}
                    {signal.verifiedFacts?.length ? (
                      <div>
                        <strong>Verified facts</strong>
                        <ul>{signal.verifiedFacts.map(fact => <li key={fact}>{fact}</li>)}</ul>
                      </div>
                    ) : null}
                    {signal.inferences?.length ? (
                      <div>
                        <strong>Inference</strong>
                        <ul>{signal.inferences.map(item => <li key={item}>{item}</li>)}</ul>
                      </div>
                    ) : null}
                  </details>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState title="No reviewed signals loaded" detail="The intelligence surface is available, but no current signal records are loaded for review." />
      )}
    </SectionShell>
  )
}
