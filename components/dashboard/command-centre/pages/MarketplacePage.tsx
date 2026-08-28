'use client'
import React, { useMemo, useState } from 'react'
import type { PipelineCounts, WantedListing, PathwayData, CannabisOperator, MySubmission } from '@/lib/dashboard/dashboardLiveData'
import type { CommandPage, MarketView, MarketRow, DashboardMarketplaceRows } from '../types'
import { CustomSelect } from '../sharedHelpers'
import { ListingDetailModal } from '../../ListingDetailModal'
import { WantedDetailModal } from '../../WantedDetailModal'
import { flagEmoji } from '@/lib/utils/flagEmoji'

const MKT_TABS: { id: MarketView; label: string }[] = [
  { id: 'cannabis', label: 'Listings' },
  { id: 'wanted', label: 'Wanted Demand' },
  { id: 'opportunities', label: 'Buyer Routes' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'services', label: 'Services' },
  { id: 'new-products', label: 'Opportunities' },
]

export const MarketplacePage = React.memo(function MarketplacePage({
  country, region, role, marketplaceRows, wantedListings, wantedCount, pathwayData, pipeline, onPageChange, mySubmissions = [],
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  wantedListings?: WantedListing[]
  wantedCount?: number
  pathwayData?: PathwayData
  cannabisOperators?: CannabisOperator[]
  operatorLicenceMatrix?: unknown
  pipeline?: PipelineCounts
  onPageChange?: (page: CommandPage) => void
  mySubmissions?: MySubmission[]
  userEmail?: string | null
}) {
  const [activeTab, setActiveTab] = useState<MarketView>('cannabis')
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [selectedWantedId, setSelectedWantedId] = useState<string | null>(null)

  const rows = useMemo(() => {
    if (activeTab === 'wanted' && wantedListings?.length) {
      return wantedListings.map(w => [w.title, w.summary ?? '', w.location_country ?? country.iso2, 'Wanted', '', '', '', w.id] as MarketRow)
    }
    return marketplaceRows?.[activeTab] ?? []
  }, [activeTab, marketplaceRows, wantedListings, country.iso2])

  return (
    <div className="cc-marketplace">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Marketplace</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      <div className="cc-mkt-tabs">
        {MKT_TABS.map(t => (
          <button key={t.id} type="button" className={activeTab === t.id ? 'cc-tab-on' : 'cc-tab'} onClick={() => setActiveTab(t.id)}>
            {t.label}
            <span className="cc-tab-count">
              {t.id === 'wanted' ? (wantedListings?.length ?? wantedCount ?? 0) : (marketplaceRows?.[t.id]?.length ?? 0)}
            </span>
          </button>
        ))}
      </div>
      <div className="cc-mkt-list">
        {rows.slice(0, 20).map((r, i) => (
          <button
            key={String(r[7] ?? i)}
            type="button"
            className="cc-mkt-row"
            onClick={() => activeTab === 'wanted' ? setSelectedWantedId(String(r[7])) : setSelectedListingId(String(r[7]))}
          >
            <div className="cc-mkt-title">{r[0]}</div>
            <div className="cc-mkt-meta">{r[2]} · {r[3]}</div>
          </button>
        ))}
        {rows.length === 0 && <div className="cc-muted">No listings for this tab.</div>}
      </div>
      {pipeline && (
        <div className="cc-mkt-pipeline">
          <span>Wanted {pipeline.wanted}</span>
          <span>Matched {pipeline.matched}</span>
          <span>Deal room {pipeline.deal_room}</span>
        </div>
      )}
      {selectedListingId && (
        <ListingDetailModal listingId={selectedListingId} onClose={() => setSelectedListingId(null)} />
      )}
      {selectedWantedId && (
        <WantedDetailModal wantedId={selectedWantedId} onClose={() => setSelectedWantedId(null)} />
      )}
    </div>
  )
})
