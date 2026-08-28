'use client'

import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { MarketView } from '../../CommandCentre'
import { MARKETPLACE_MEDIA_COPY } from '@/lib/dashboard/marketplaceMediaProjection'
import { getSubjectRepresentativeMedia } from '@/lib/dashboard/marketplaceSubjectMedia'
import {
  MARKET_TABS,
  MOBILE_COMMAND_COPY,
  formatStatus,
  type MobileCommandTool,
  type NormalizedListing,
  type SectionId,
} from '../contracts'
import { MarketplaceWorkspacePanel } from '../WorkspacePanels'
import { EmptyState, SectionShell, type SectionRef } from '../SectionUI'
import {
  MarketDetailSheet,
  MarketFeed,
  type MarketCardModel,
  type MarketFeedRow,
  type MarketTier,
  resolveMarketTier,
  defaultCtaForTier,
} from '../../market'
import '../MarketplaceListingMedia.css'
import '../MarketplaceInventoryFirst.css'
import '../../market/Market.css'

type MediaStage = 'primary' | 'fallback' | 'empty'

const TIER_A_VIEWS = new Set<MarketView>([
  'equipment',
  'consumables',
  'new-products',
  'services',
])

function tierForView(view: MarketView): MarketTier {
  return TIER_A_VIEWS.has(view) ? 'A' : 'B'
}

function tierForListing(row: NormalizedListing): MarketTier {
  const fromCategory = resolveMarketTier(
    row.category.toLowerCase().replace(/\s+/g, '_').replace(/&/g, ''),
  )
  if (fromCategory === 'A') return 'A'
  return tierForView(row.view)
}

function listingImage(row: NormalizedListing): string | null {
  if (row.media?.src) return row.media.src
  const representative = getSubjectRepresentativeMedia(row.view, row.id, row.title, row.category)
  return representative.src || null
}

function toMarketCardModel(row: NormalizedListing): MarketCardModel {
  const tier = tierForListing(row)
  const isCatalogue = (row.status || '').toLowerCase().includes('illustrative')
    || (row.status || '').toLowerCase().includes('catalogue')
    || (row.channel || '').toLowerCase().includes('catalogue')
  const variant = isCatalogue
    ? 'catalogue'
    : tier === 'A'
      ? 'tierA-compact'
      : 'tierB-teaser'

  return {
    id: `${row.view}-${row.id}`,
    title: row.title,
    description: row.summary,
    priceDisplay: row.priceDisplay?.trim() || (tier === 'A' ? 'Request quote' : 'Confirm through Harbourview'),
    imageUrl: listingImage(row),
    country: row.jurisdiction,
    category: row.category,
    condition: formatStatus(row.status),
    badge: tier === 'A' ? 'Open' : isCatalogue ? 'Catalogue' : 'Review',
    badgeTone: tier === 'A' ? 'ok' : isCatalogue ? 'muted' : 'warn',
    variant,
    tier,
    ctaLabel: isCatalogue ? 'View details' : defaultCtaForTier(tier),
  }
}

function relatedFor(row: NormalizedListing, pool: NormalizedListing[], limit = 6): MarketCardModel[] {
  const sameCategory = pool.filter(
    r => r.id !== row.id && r.category === row.category,
  )
  const sameView = pool.filter(
    r => r.id !== row.id && r.view === row.view && r.category !== row.category,
  )
  const merged = [...sameCategory, ...sameView].slice(0, limit)
  return merged.map(toMarketCardModel)
}

function complementsFor(row: NormalizedListing, pool: NormalizedListing[], limit = 6): MarketCardModel[] {
  // Cross-category upsell: equipment ↔ consumables ↔ services
  const complementViews: MarketView[] =
    row.view === 'equipment'
      ? ['consumables', 'services']
      : row.view === 'consumables'
        ? ['equipment', 'services']
        : row.view === 'services'
          ? ['equipment', 'consumables']
          : ['equipment', 'consumables', 'services']
  return pool
    .filter(r => r.id !== row.id && complementViews.includes(r.view))
    .slice(0, limit)
    .map(toMarketCardModel)
}

function buildFeedRows(filtered: NormalizedListing[], all: NormalizedListing[]): MarketFeedRow[] {
  if (!filtered.length) return []

  const cards = filtered.map(toMarketCardModel)
  const rows: MarketFeedRow[] = []

  // First 4 as grid
  const head = cards.slice(0, 4)
  if (head.length) {
    rows.push({ type: 'grid', id: 'grid-head', items: head })
  }

  // Related rail from remaining same-view inventory (buy more)
  const railSource = all
    .filter(r => !filtered.slice(0, 4).some(f => f.id === r.id && f.view === r.view))
    .slice(0, 8)
    .map(toMarketCardModel)
  if (railSource.length >= 2) {
    rows.push({
      type: 'rail',
      id: 'rail-more',
      title: 'Often viewed with these',
      items: railSource,
    })
  }

  // Rest of grid
  const tail = cards.slice(4)
  if (tail.length) {
    rows.push({ type: 'grid', id: 'grid-tail', items: tail })
  }

  return rows
}

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

function findListing(id: string, rows: NormalizedListing[]): NormalizedListing | null {
  return rows.find(r => `${r.view}-${r.id}` === id) || null
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

  const [detailId, setDetailId] = useState<string | null>(null)

  const detailListing = useMemo(
    () => (detailId ? findListing(detailId, marketRows) : null),
    [detailId, marketRows],
  )
  const detailCard = useMemo(
    () => (detailListing ? toMarketCardModel(detailListing) : null),
    [detailListing],
  )

  const feedRows = useMemo(
    () => buildFeedRows(filteredRows, marketRows),
    [filteredRows, marketRows],
  )

  function selectAndFocus(view: MarketView) {
    onMarketViewChange(view)
    setDetailId(null)
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

  function openDetail(id: string) {
    setDetailId(id)
  }

  function openInquiry(id: string) {
    const listing = findListing(id, marketRows)
    if (!listing) return
    setDetailId(null)
    onOpenTool('introduction', { listing, marketView: listing.view })
  }

  return (
    <SectionShell id="marketplace" sectionRef={sectionRef} eyebrow="Marketplace control" title="Demand, supply and commercial routes" description={MOBILE_COMMAND_COPY.marketplaceDescription} className="hvm2-market-section">
      <div className="hvm2-quick-actions">
        <a href={commandHref('marketplace', { tool: 'wanted-intake', marketView: 'wanted' })} onClick={event => keepInCommand(event, 'wanted-intake', { marketView: 'wanted' })}><span>＋</span><strong>Post wanted demand</strong><small>Buyer-led requirement</small></a>
        <a href={commandHref('marketplace', { tool: 'supply-intake', marketView: supplyView })} onClick={event => keepInCommand(event, 'supply-intake', { marketView: supplyView })}><span>↗</span><strong>Submit supply</strong><small>Consumables &amp; equipment open; licensed routes reviewed</small></a>
        <a href={commandHref('financing', { tool: 'financing-intake', marketView: activeMarketView })} onClick={event => keepInCommand(event, 'financing-intake', { marketView: activeMarketView })}><span>¤</span><strong>Trade financing</strong><small>Structured inquiry</small></a>
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
                onClick={() => selectAndFocus(tab.id)}
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
          <MarketFeed
            rows={feedRows}
            onOpen={openDetail}
            onCta={openInquiry}
          />
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

      {detailCard && detailListing ? (
        <MarketDetailSheet
          listing={detailCard}
          description={detailListing.summary}
          specs={[
            { label: 'Category', value: detailListing.category },
            { label: 'Jurisdiction', value: detailListing.jurisdiction },
            { label: 'Status', value: formatStatus(detailListing.status) },
            { label: 'Channel', value: detailListing.channel || MOBILE_COMMAND_COPY.listingChannel },
          ]}
          related={relatedFor(detailListing, marketRows)}
          complements={complementsFor(detailListing, marketRows)}
          tier={detailCard.tier}
          onCta={() => openInquiry(detailCard.id)}
          onOpenRelated={openDetail}
          onClose={() => setDetailId(null)}
        />
      ) : null}
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
  const [detailId, setDetailId] = useState<string | null>(null)
  const detailListing = useMemo(
    () => (detailId ? findListing(detailId, supplyRows) : null),
    [detailId, supplyRows],
  )
  const detailCard = useMemo(
    () => (detailListing ? toMarketCardModel(detailListing) : null),
    [detailListing],
  )

  const feedRows = useMemo(() => {
    const cards = supplyRows.map(toMarketCardModel)
    const rows: MarketFeedRow[] = []
    if (cards.length) rows.push({ type: 'grid', id: 'supply-grid', items: cards })
    return rows
  }, [supplyRows])

  return (
    <SectionShell
      id="supply"
      sectionRef={sectionRef}
      eyebrow="Supply"
      title="Products, consumables, equipment and services"
      description="Open commercial supply for consumables and equipment. Licensed inventory remains review-gated."
      className="hvm2-market-section"
    >
      {supplyRows.length > 0 ? (
        <MarketFeed
          rows={feedRows}
          onOpen={setDetailId}
          onCta={(id) => {
            const listing = findListing(id, supplyRows)
            if (listing) onOpenTool('introduction', { listing, marketView: listing.view })
          }}
        />
      ) : (
        <EmptyState title="No supply records yet" detail={MOBILE_COMMAND_COPY.marketplaceEmptyDetail} />
      )}

      {detailCard && detailListing ? (
        <MarketDetailSheet
          listing={detailCard}
          description={detailListing.summary}
          specs={[
            { label: 'Category', value: detailListing.category },
            { label: 'Jurisdiction', value: detailListing.jurisdiction },
            { label: 'Status', value: formatStatus(detailListing.status) },
          ]}
          related={relatedFor(detailListing, supplyRows)}
          complements={complementsFor(detailListing, supplyRows)}
          tier={detailCard.tier}
          onCta={() => {
            onOpenTool('introduction', { listing: detailListing, marketView: detailListing.view })
            setDetailId(null)
          }}
          onOpenRelated={setDetailId}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </SectionShell>
  )
}
