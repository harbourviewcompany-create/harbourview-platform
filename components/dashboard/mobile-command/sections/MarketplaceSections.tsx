'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { MarketView } from '../../CommandCentre'
import { MARKETPLACE_MEDIA_COPY } from '@/lib/dashboard/marketplaceMediaProjection'
import { getSubjectRepresentativeMedia } from '@/lib/dashboard/marketplaceSubjectMedia'
import {
  MARKET_TABS,
  MOBILE_COMMAND_COPY,
  SUPPLY_TABS,
  formatStatus,
  type MobileCommandTool,
  type NormalizedListing,
  type SectionId,
} from '../contracts'
import { MarketplaceWorkspacePanel } from '../WorkspacePanels'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'
import '../MarketplaceListingMedia.css'
import '../MarketplaceInventoryFirst.css'

type MediaStage = 'primary' | 'fallback' | 'empty'

export function resolveListingMediaStage(row: NormalizedListing, stage: MediaStage) {
  const media = row.media
  if (!media || stage === 'empty') {
    const representative = getSubjectRepresentativeMedia(
      row.view,
      row.id,
      row.title,
      row.category,
    )
    return {
      src: representative.src,
      altText: representative.altText,
      kind: 'representative' as const,
      badgeLabel: MARKETPLACE_MEDIA_COPY.representativeBadge,
      caption: representative.caption,
    }
  }
  if (stage === 'fallback') {
    return {
      src: media.fallbackSrc,
      altText: media.fallbackAltText,
      kind: 'representative' as const,
      badgeLabel: MARKETPLACE_MEDIA_COPY.representativeBadge,
      caption: media.fallbackCaption,
    }
  }
  return {
    src: media.src,
    altText: media.altText,
    kind: media.kind,
    badgeLabel: media.badgeLabel,
    caption: media.caption,
  }
}

function ListingCardMedia({ row }: { row: NormalizedListing }) {
  const [stage, setStage] = useState<MediaStage>('primary')
  const mediaSignature = row.media ? `${row.media.src}|${row.media.fallbackSrc}` : 'none'

  useEffect(() => {
    setStage('primary')
  }, [row.id, row.view, mediaSignature])

  const media = resolveListingMediaStage(row, stage)

  return (
    <figure className="hvm2-listing-media" data-media-kind={media.kind}>
      <img
        src={media.src}
        alt={media.altText}
        loading="lazy"
        decoding="async"
        data-fallback-src={row.media?.fallbackSrc ?? media.src}
        onError={() => {
          if (stage === 'primary' && row.media?.fallbackSrc && row.media.fallbackSrc !== media.src) {
            setStage('fallback')
            return
          }
          if (stage !== 'empty') {
            setStage('empty')
          }
        }}
      />
      {media.badgeLabel && <span className="hvm2-listing-media-badge">{media.badgeLabel}</span>}
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  )
}

function ListingCard({ row, cta, onSelect }: { row: NormalizedListing; cta: string; onSelect: () => void }) {
  return (
    <article className="hvm2-listing-card">
      <ListingCardMedia row={row} />
      <div className="hvm2-card-topline"><StatusPill tone="gold">{row.category}</StatusPill><span>{row.jurisdiction}</span></div>
      <h3>{row.title}</h3>
      <p>{row.summary}</p>
      <div className="hvm2-card-meta">
        <span>{formatStatus(row.status)}</span>
        <span>{row.channel || MOBILE_COMMAND_COPY.listingChannel}</span>
        {row.confidence != null && <span>{row.confidence}% confidence</span>}
      </div>
      <button type="button" className="hvm2-inline-cta" onClick={onSelect}>{cta}</button>
    </article>
  )
}

export function MarketplaceSection({
  sectionRef,
  activeMarketView,
  marketQuery,
  marketRows,
  filteredRows,
  activeTool,
  selectedListing,
  onMarketViewChange,
  onMarketQueryChange,
  onOpenTool,
  onCloseTool,
  onViewSubmissions,
  commandHref,
}: {
  sectionRef: SectionRef
  activeMarketView: MarketView
  marketQuery: string
  marketRows: NormalizedListing[]
  filteredRows: NormalizedListing[]
  activeTool: MobileCommandTool | null
  selectedListing: NormalizedListing | null
  onMarketViewChange: (view: MarketView) => void
  onMarketQueryChange: (value: string) => void
  onOpenTool: (tool: MobileCommandTool, options?: { listing?: NormalizedListing; marketView?: MarketView }) => void
  onCloseTool: () => void
  onViewSubmissions: () => void
  commandHref: (section: SectionId, changes?: Record<string, string | null>) => string
}) {
  const tabRefs = useRef(new Map<MarketView, HTMLButtonElement>())
  const searchLabel = `Search ${MARKET_TABS.find(tab => tab.id === activeMarketView)?.label.toLowerCase() ?? 'marketplace'}`
  const supplyView = activeMarketView === 'wanted' ? 'cannabis' : activeMarketView

  function selectAndFocus(view: MarketView) {
    onMarketViewChange(view)
    window.requestAnimationFrame(() => tabRefs.current.get(view)?.focus())
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentView: MarketView) {
    const currentIndex = MARKET_TABS.findIndex(tab => tab.id === currentView)
    if (currentIndex < 0) return

    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % MARKET_TABS.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + MARKET_TABS.length) % MARKET_TABS.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = MARKET_TABS.length - 1
    if (nextIndex == null) return

    event.preventDefault()
    selectAndFocus(MARKET_TABS[nextIndex].id)
  }

  function keepInCommand(
    event: MouseEvent<HTMLAnchorElement>,
    tool: MobileCommandTool,
    options?: { listing?: NormalizedListing; marketView?: MarketView },
  ) {
    event.preventDefault()
    onOpenTool(tool, options)
  }

  return (
    <SectionShell id="marketplace" sectionRef={sectionRef} eyebrow="Marketplace control" title="Demand, supply and commercial routes" description={MOBILE_COMMAND_COPY.marketplaceDescription} className="hvm2-market-section">
      <div className="hvm2-quick-actions">
        <a href={commandHref('marketplace', { tool: 'wanted-intake', marketView: 'wanted' })} onClick={event => keepInCommand(event, 'wanted-intake', { marketView: 'wanted' })}><span>＋</span><strong>Post wanted demand</strong><small>Buyer-led requirement</small></a>
        <a href={commandHref('marketplace', { tool: 'supply-intake', marketView: supplyView })} onClick={event => keepInCommand(event, 'supply-intake', { marketView: supplyView })}><span>↗</span><strong>Submit supply</strong><small>Controlled review intake</small></a>
        <a href={commandHref('financing', { tool: 'financing-intake', marketView: activeMarketView })} onClick={event => keepInCommand(event, 'financing-intake')}><span>¤</span><strong>Request financing</strong><small>Trade structure review</small></a>
      </div>

      <MarketplaceWorkspacePanel
        tool={activeTool}
        selectedListing={selectedListing}
        activeMarketView={activeMarketView}
        onClose={onCloseTool}
        onViewSubmissions={onViewSubmissions}
      />

      <div className="hvm2-market-controls">
        <div className="hvm2-tab-rail" role="tablist" aria-label="Marketplace categories">
          {MARKET_TABS.map(tab => {
            const count = marketRows.filter(row => row.view === tab.id).length
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  if (node) tabRefs.current.set(tab.id, node)
                  else tabRefs.current.delete(tab.id)
                }}
                type="button"
                role="tab"
                id={`hvm2-tab-${tab.id}`}
                aria-controls="hvm2-market-panel"
                aria-selected={activeMarketView === tab.id}
                aria-label={`${tab.label}, ${count} records`}
                tabIndex={activeMarketView === tab.id ? 0 : -1}
                className={activeMarketView === tab.id ? 'active' : ''}
                onClick={() => onMarketViewChange(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              >
                {tab.label}<span aria-hidden="true">{count}</span>
              </button>
            )
          })}
        </div>
        <label className="hvm2-search-field">
          <span aria-hidden="true">⌕</span>
          <input value={marketQuery} onChange={event => onMarketQueryChange(event.target.value)} aria-label={searchLabel} placeholder={searchLabel} />
        </label>
      </div>
      <div id="hvm2-market-panel" role="tabpanel" aria-labelledby={`hvm2-tab-${activeMarketView}`} tabIndex={0}>
        {filteredRows.length > 0 ? (
          <div className="hvm2-listing-grid">
            {filteredRows.map(row => <ListingCard key={`${row.view}-${row.id}`} row={row} onSelect={() => onOpenTool('introduction', { listing: row })} cta={MOBILE_COMMAND_COPY.reviewedIntroduction} />)}
          </div>
        ) : (
          <EmptyState
            title={marketQuery.trim() ? 'No records match this search' : 'No reviewed records in this category yet'}
            detail={
              marketQuery.trim()
                ? 'Clear the search or switch category. Absence of results is not a claim about market supply.'
                : MOBILE_COMMAND_COPY.marketplaceEmptyDetail
            }
          />
        )}
      </div>
    </SectionShell>
  )
}

export function SupplySection({
  sectionRef,
  supplyRows,
  onOpenTool,
}: {
  sectionRef: SectionRef
  supplyRows: NormalizedListing[]
  onOpenTool: (tool: MobileCommandTool, options?: { listing?: NormalizedListing; marketView?: MarketView }) => void
}) {
  return (
    <SectionShell
      id="supply"
      sectionRef={sectionRef}
      eyebrow="Supply"
      title="Products, consumables, equipment and services"
      description={MOBILE_COMMAND_COPY.supplyDescription}
      action={<button type="button" className="hvm2-text-link" onClick={() => onOpenTool('supply-intake', { marketView: 'cannabis' })}>Submit supply</button>}
    >
      <div className="hvm2-metric-grid">
        {SUPPLY_TABS.map((tab) => {
          const count = supplyRows.filter((row) => row.view === tab.id).length
          return (
            <Metric
              key={tab.id}
              label={tab.label}
              value={count}
              detail={count === 0 ? 'No approved records yet' : 'Approved loaded records'}
            />
          )
        })}
      </div>
      {supplyRows.length > 0 ? (
        <div className="hvm2-horizontal-deck hvm2-deck-spaced">
          {supplyRows.map(row => <ListingCard key={`supply-${row.view}-${row.id}`} row={row} onSelect={() => onOpenTool('introduction', { listing: row })} cta={MOBILE_COMMAND_COPY.supplyReview} />)}
        </div>
      ) : (
        <EmptyState
          title="No reviewed supply records yet"
          detail={MOBILE_COMMAND_COPY.supplyEmptyDetail}
        />
      )}
    </SectionShell>
  )
}
