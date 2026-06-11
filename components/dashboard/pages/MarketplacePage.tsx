'use client'

import React, { useState } from 'react'
import type { PipelineCounts, WantedListing } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'

export interface MarketplacePageProps {
  country: { iso2: string; label: string }
  region: string
  role: string
  marketplaceRows?: DashboardMarketplaceRows
  wantedCount?: number
  wantedListings?: WantedListing[]
  pipeline?: PipelineCounts
}

const VIEW_TABS: { id: MarketView; label: string; icon: string }[] = [
  { id: 'cannabis', label: 'Listings', icon: '◈' },
  { id: 'equipment', label: 'Equipment', icon: '⊞' },
  { id: 'consumables', label: 'Consumables', icon: '⊟' },
  { id: 'new-products', label: 'New Products', icon: '⬡' },
  { id: 'services', label: 'Services', icon: '◉' },
  { id: 'opportunities', label: 'Opportunities', icon: '◷' },
  { id: 'wanted', label: 'Wanted Demand', icon: '≋' },
]

function ListingCard({ row, idx }: { row: MarketRow; idx: number }) {
  const isWanted = row.specType === 'wanted'
  return (
    <article className={`mp-card${isWanted ? ' mp-card--wanted' : ''}`} style={{ animationDelay: `${idx * 40}ms` }}>
      <div className="mp-card-head"><span className="mp-type-chip">{row.typeLabel}</span><span className="mp-price">{row.statusLabel}</span></div>
      <h3 className="mp-card-title">{row.title}</h3>
      <p className="mp-card-desc">{row.description}</p>
      <dl className="mp-card-facts"><div><dt>Jurisdiction</dt><dd>{row.jurisdiction}</dd></div><div><dt>Category</dt><dd>{row.category}</dd></div><div><dt>Review</dt><dd>{row.trustLabel}</dd></div></dl>
      <div className="mp-card-foot"><div className="mp-tags">{(row.tags ?? []).filter(Boolean).slice(0, 4).map(tag => <span key={tag} className="mp-tag">{tag}</span>)}</div><button type="button" className="mp-action-btn" disabled aria-disabled="true">{row.actionLabel} →</button></div>
    </article>
  )
}

function PipelineBar({ pipeline }: { pipeline?: PipelineCounts }) {
  if (!pipeline) return null
  const steps = [['Wanted', pipeline.wanted], ['Matched', pipeline.matched], ['Proof Review', pipeline.proof_review], ['Inquiry', pipeline.inquiry], ['Deal Room', pipeline.deal_room]] as const
  return <div className="mp-pipeline">{steps.map(([label, val], i) => <React.Fragment key={label}><div className="mp-pipe-step"><div className="mp-pipe-val">{val}</div><div className="mp-pipe-label">{label}</div></div>{i < steps.length - 1 && <div className="mp-pipe-arrow">›</div>}</React.Fragment>)}</div>
}

export const MarketplacePage = React.memo(function MarketplacePage({ country, marketplaceRows, wantedCount = 0, wantedListings = [], pipeline }: MarketplacePageProps) {
  const [activeView, setActiveView] = useState<MarketView>('cannabis')
  const rows = marketplaceRows?.[activeView] ?? []
  const totalListings = Object.values(marketplaceRows ?? {}).reduce((n, r) => n + (r?.length ?? 0), 0)

  return (
    <div className="mp-root"><style>{CSS}</style>
      <div className="mp-header"><div className="mp-header-left"><h1 className="mp-heading">Marketplace &amp; Access</h1><p className="mp-sub">{country.label} · {totalListings > 0 ? `${totalListings} public-safe rows` : 'No public-safe rows available'}</p></div><div className="mp-header-actions"><a href="/marketplace/wanted" className="mp-cta-outline">Post Wanted Request</a><a href="/marketplace/sell" className="mp-cta-gold">List for Sale →</a></div></div>
      <PipelineBar pipeline={pipeline} />
      <div className="mp-tabs-row">{VIEW_TABS.map(tab => <button key={tab.id} type="button" className={`mp-tab${activeView === tab.id ? ' active' : ''}`} onClick={() => setActiveView(tab.id)}><span>{tab.icon}</span><span>{tab.label}</span>{(marketplaceRows?.[tab.id]?.length ?? 0) > 0 && <span className="mp-tab-badge">{marketplaceRows?.[tab.id]?.length}</span>}</button>)}</div>
      <div className="mp-content">{rows.length > 0 ? <div className="mp-grid">{rows.map((row, i) => <ListingCard key={row.id} row={row} idx={i} />)}</div> : activeView === 'wanted' && wantedListings.length > 0 ? <div className="mp-grid">{wantedListings.map((w, i) => <article key={w.id} className="mp-card mp-card--wanted" style={{ animationDelay: `${i * 40}ms` }}><div className="mp-card-head"><span className="mp-type-chip">Wanted Request</span><span className="mp-price">{w.location_country ?? country.iso2}</span></div><h3 className="mp-card-title">{w.title}</h3><p className="mp-card-desc">{w.summary ?? 'Public-safe wanted-request summary is not available yet.'}</p><div className="mp-card-foot"><div className="mp-tags"><span className="mp-tag">wanted</span><span className="mp-tag">public-safe</span></div><button type="button" className="mp-action-btn" disabled aria-disabled="true">Respond through Harbourview →</button></div></article>)}</div> : <div className="mp-gap"><div className="mp-gap-icon">⊞</div><div className="mp-gap-title">{activeView === 'wanted' ? `${wantedCount || 'No'} wanted requests` : 'No public-safe rows in this category'}</div><p className="mp-gap-body">Rows appear here only after they pass public DTO review. Supplier identity, provenance, internal review notes, and source evidence remain excluded.</p><div className="mp-gap-actions"><a href="/marketplace" className="mp-cta-outline">Browse Marketplace</a><a href="/marketplace/sell" className="mp-cta-gold">Submit Listing →</a></div></div>}</div>
    </div>
  )
})

const CSS = `
.mp-root{display:flex;flex-direction:column;height:100%;overflow:hidden}.mp-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0;gap:16px}.mp-heading{font-family:Georgia,serif;font-size:22px;font-weight:400;color:#f5f0e8}.mp-sub{font-size:11px;color:rgba(245,240,232,.42)}.mp-header-actions{display:flex;gap:8px}.mp-cta-gold,.mp-cta-outline{display:inline-flex;align-items:center;padding:8px 14px;border-radius:8px;font-size:12px;text-decoration:none}.mp-cta-gold{background:linear-gradient(135deg,#d4a84b,#b88c35);color:#0d1117;font-weight:600}.mp-cta-outline{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(245,240,232,.65)}.mp-pipeline{display:flex;padding:12px 24px;border-bottom:1px solid rgba(255,255,255,.06)}.mp-pipe-step{display:flex;flex-direction:column;align-items:center;flex:1}.mp-pipe-val{font-size:20px;font-weight:700;color:#d4a84b}.mp-pipe-label{font-family:JetBrains Mono,Fira Mono,monospace;font-size:8px;color:rgba(245,240,232,.38);text-transform:uppercase}.mp-pipe-arrow{color:rgba(255,255,255,.18);font-size:18px}.mp-tabs-row{display:flex;gap:2px;padding:12px 24px 0;overflow-x:auto}.mp-tab{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1px solid transparent;background:transparent;color:rgba(245,240,232,.42);font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}.mp-tab.active{color:#d4a84b;border-color:rgba(212,168,75,.25);background:rgba(212,168,75,.06)}.mp-tab-badge{background:rgba(212,168,75,.18);color:#d4a84b;font-size:9px;padding:1px 5px;border-radius:10px}.mp-content{flex:1;overflow-y:auto;padding:16px 24px 24px}.mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}.mp-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px}.mp-card--wanted{border-color:rgba(212,168,75,.2);background:rgba(212,168,75,.03)}.mp-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.mp-type-chip{font-family:JetBrains Mono,Fira Mono,monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,240,232,.38)}.mp-price{font-size:11px;font-weight:600;color:#d4a84b}.mp-card-title{font-size:13px;font-weight:600;color:#f5f0e8;margin:0}.mp-card-desc{font-size:11px;color:rgba(245,240,232,.5);line-height:1.55;margin:0}.mp-card-facts{display:grid;gap:4px;margin:0}.mp-card-facts div{display:grid;grid-template-columns:86px 1fr;gap:8px}.mp-card-facts dt{font-size:9px;color:rgba(245,240,232,.32);text-transform:uppercase}.mp-card-facts dd{font-size:10px;color:rgba(245,240,232,.58);margin:0}.mp-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px}.mp-tags{display:flex;flex-wrap:wrap;gap:4px}.mp-tag{font-size:9px;padding:2px 7px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:rgba(245,240,232,.42)}.mp-action-btn{font-size:10px;padding:5px 10px;border-radius:6px;border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.07);color:#d4a84b;cursor:not-allowed;font:inherit;white-space:nowrap}.mp-gap{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:60px 24px}.mp-gap-icon{font-size:28px;color:rgba(212,168,75,.4)}.mp-gap-title{font-family:Georgia,serif;font-size:18px;color:#f5f0e8}.mp-gap-body{font-size:12px;color:rgba(245,240,232,.45);max-width:460px;line-height:1.65}.mp-gap-actions{display:flex;gap:8px}@media(max-width:760px){.mp-header{align-items:flex-start;flex-direction:column;padding:16px 14px 0}.mp-content{padding:12px 14px 18px}.mp-grid{grid-template-columns:1fr}.mp-pipeline{overflow-x:auto;padding:10px 14px}.mp-pipe-step{min-width:82px}.mp-card-foot{align-items:flex-start;flex-direction:column}.mp-action-btn{width:100%}.mp-header-actions{width:100%;flex-wrap:wrap}.mp-tabs-row{padding-left:14px;padding-right:14px}}
`
