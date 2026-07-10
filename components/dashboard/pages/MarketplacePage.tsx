'use client'

import React, { useState } from 'react'
import type { PipelineCounts, WantedListing } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'

export interface MarketplacePageProps {
  country:        { iso2: string; label: string }
  region:         string
  role:           string
  marketplaceRows?: DashboardMarketplaceRows
  wantedCount?:   number
  wantedListings?: WantedListing[]
  pipeline?:      PipelineCounts
}

const VIEW_TABS: { id: MarketView; label: string; icon: string }[] = [
  { id: 'cannabis',      label: 'Cannabis',      icon: '◈' },
  { id: 'equipment',     label: 'Equipment',     icon: '⊞' },
  { id: 'consumables',   label: 'Consumables',   icon: '⊟' },
  { id: 'new-products',  label: 'New Products',  icon: '⬡' },
  { id: 'services',      label: 'Services',      icon: '◉' },
  { id: 'opportunities', label: 'Opportunities', icon: '◷' },
  { id: 'wanted',        label: 'Wanted Demand', icon: '≋' },
]

function TrustBar({ trust }: { trust: string }) {
  if (!trust) return null
  const badges = trust.split('|').filter(Boolean).map((seg, i) => {
    const colonIdx = seg.indexOf(':')
    if (colonIdx === -1) {
      return <span key={i} className="mp-trust-badge mp-trust-badge--muted">{seg === 'PUBLIC' ? 'Public listing' : seg}</span>
    }
    const key    = seg.slice(0, colonIdx)
    const status = seg.slice(colonIdx + 1)
    const ok     = status === 'ok'
    const cls    = ok ? 'mp-trust-badge mp-trust-badge--ok' : 'mp-trust-badge mp-trust-badge--warn'
    const label  =
      key === 'VER'       ? (ok ? 'Seller verified'    : 'Seller unverified')  :
      key === 'PROOF'     ? (ok ? 'Evidence verified'  : 'Evidence pending')   :
      key === 'REG'       ? (ok ? 'Reg-ready'          : 'Reg review needed')  :
      /^\d+$/.test(key)  ? `Score ${key}`                                      : key
    return <span key={i} className={cls}>{label}</span>
  })
  return <div className="mp-trust-bar">{badges}</div>
}

// MarketRow = [specClass, typeLabel, title, description, tags, trust, action, price]
function ListingCard({ row, idx }: { row: MarketRow; idx: number }) {
  const [specClass, typeLabel, title, description, tags, trust, action, price] = row
  const tagList = tags.split('|').filter(Boolean).slice(0, 3)
  const isWanted = specClass === 'wanted' || action?.toLowerCase().includes('demand')
  return (
    <div className={`mp-card${isWanted ? ' mp-card--wanted' : ''}`} style={{ animationDelay: `${idx * 40}ms` }}>
      <div className="mp-card-head">
        <div className="mp-card-meta">
          <span className="mp-type-chip">{typeLabel}</span>
        </div>
        <span className="mp-price">{price}</span>
      </div>
      <div className="mp-card-title">{title}</div>
      <div className="mp-card-desc">{description}</div>
      {trust && <TrustBar trust={trust} />}
      <div className="mp-card-foot">
        <div className="mp-tags">
          {tagList.map(t => <span key={t} className="mp-tag">{t}</span>)}
        </div>
        <button className="mp-action-btn">{action} →</button>
      </div>
    </div>
  )
}

function PipelineBar({ pipeline }: { pipeline?: PipelineCounts }) {
  if (!pipeline) return null
  const steps = [
    { label: 'Wanted',      val: pipeline.wanted,       color: '#d4a84b' },
    { label: 'Matched',     val: pipeline.matched,      color: '#5b9bd5' },
    { label: 'Proof Review',val: pipeline.proof_review, color: '#9b72d0' },
    { label: 'Inquiry',     val: pipeline.inquiry,      color: '#4caf82' },
    { label: 'Deal Room',   val: pipeline.deal_room,    color: '#e6a533' },
  ]
  return (
    <div className="mp-pipeline">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="mp-pipe-step">
            <div className="mp-pipe-val" style={{ color: s.color }}>{s.val}</div>
            <div className="mp-pipe-label">{s.label}</div>
          </div>
          {i < steps.length - 1 && <div className="mp-pipe-arrow">›</div>}
        </React.Fragment>
      ))}
    </div>
  )
}

export const MarketplacePage = React.memo(function MarketplacePage({
  country, marketplaceRows, wantedCount = 0, wantedListings = [], pipeline,
}: MarketplacePageProps) {
  const [activeView, setActiveView] = useState<MarketView>('cannabis')

  const rows = marketplaceRows?.[activeView as MarketView] ?? []
  const totalListings = Object.values(marketplaceRows ?? {}).reduce((n, r) => n + (r?.length ?? 0), 0)

  return (
    <div className="mp-root">
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mp-header">
        <div className="mp-header-left">
          <h1 className="mp-heading">Marketplace & Access</h1>
          <p className="mp-sub">{country.label} · {totalListings > 0 ? `${totalListings} active listings` : 'Listings loading'}</p>
        </div>
        <div className="mp-header-actions">
          <a href="/marketplace/wanted" className="mp-cta-outline">Post Wanted Request</a>
          <a href="/marketplace/sell" className="mp-cta-gold">List for Sale →</a>
        </div>
      </div>

      {/* ── Pipeline ────────────────────────────────────────────────────────── */}
      <PipelineBar pipeline={pipeline} />

      {/* ── Category tabs ────────────────────────────────────────────────────── */}
      <div className="mp-tabs-row">
        {VIEW_TABS.map(tab => {
          const count = marketplaceRows?.[tab.id]?.length ?? 0
          return (
            <button
              key={tab.id}
              className={`mp-tab${activeView === tab.id ? ' active' : ''}`}
              onClick={() => setActiveView(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && <span className="mp-tab-badge">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* ── Listings grid ───────────────────────────────────────────────────── */}
      <div className="mp-content">
        {rows.length > 0 ? (
          <div className="mp-grid">
            {rows.map((row, i) => <ListingCard key={i} row={row} idx={i} />)}
          </div>
        ) : activeView === 'wanted' && wantedListings.length > 0 ? (
          <div className="mp-grid">
            {wantedListings.map((w, i) => (
              <div key={w.id} className="mp-card mp-card--wanted" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="mp-card-head">
                  <span className="mp-type-chip">Wanted Request</span>
                  <span className="mp-price">{w.location_country ?? country.iso2}</span>
                </div>
                <div className="mp-card-title">{w.title}</div>
                <div className="mp-card-desc">{w.summary ?? 'Contact Harbourview to express supply interest.'}</div>
                <div className="mp-card-foot">
                  <div className="mp-tags"><span className="mp-tag">Active buyer</span><span className="mp-tag">Verified demand</span></div>
                  <button className="mp-action-btn">Respond to Demand →</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mp-gap">
            <div className="mp-gap-icon">⊞</div>
            <div className="mp-gap-title">
              {activeView === 'wanted'
                ? `${wantedCount > 0 ? wantedCount : 'No'} active wanted requests`
                : 'No listings in this category yet'}
            </div>
            <p className="mp-gap-body">
              {activeView === 'wanted'
                ? 'Post a wanted request to signal your demand to verified suppliers.'
                : 'Harbourview is actively sourcing in this category. Submit a listing to be included in the review queue.'}
            </p>
            <div className="mp-gap-actions">
              <a href="/marketplace" className="mp-cta-outline">Browse Marketplace</a>
              <a href="/marketplace/sell" className="mp-cta-gold">Submit Listing →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

const CSS = `
.mp-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:mpIn .28s ease;
}
@keyframes mpIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.mp-header {
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.mp-header-left { display:flex;flex-direction:column;gap:3px; }
.mp-heading {
  font-family:'Georgia',serif;font-size:22px;font-weight:400;
  color:#f5f0e8;letter-spacing:-.01em;
}
.mp-sub { font-size:11px;color:rgba(245,240,232,.42); }
.mp-header-actions { display:flex;gap:8px;flex-shrink:0; }

.mp-cta-gold {
  display:inline-flex;align-items:center;
  padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;
  background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;
  transition:opacity .12s;
}
.mp-cta-gold:hover { opacity:.88; }
.mp-cta-outline {
  display:inline-flex;align-items:center;
  padding:8px 14px;border-radius:8px;font-size:12px;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.65);text-decoration:none;
  transition:background .12s,color .12s;
}
.mp-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

.mp-pipeline {
  display:flex;align-items:center;gap:0;
  padding:12px 24px;flex-shrink:0;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.mp-pipe-step { display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;padding:4px 8px; }
.mp-pipe-val { font-size:20px;font-weight:700;line-height:1; }
.mp-pipe-label { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:8px;color:rgba(245,240,232,.38);text-transform:uppercase;letter-spacing:.12em; }
.mp-pipe-arrow { color:rgba(255,255,255,.18);font-size:18px;flex-shrink:0; }

.mp-tabs-row {
  display:flex;gap:2px;padding:12px 24px 0;flex-shrink:0;overflow-x:auto;
}
.mp-tab {
  display:flex;align-items:center;gap:5px;
  padding:7px 12px;border-radius:8px;
  border:1px solid transparent;background:transparent;
  color:rgba(245,240,232,.42);font:inherit;font-size:11px;
  cursor:pointer;white-space:nowrap;flex-shrink:0;
  transition:color .12s,background .12s,border-color .12s;
}
.mp-tab:hover { color:rgba(245,240,232,.8);background:rgba(255,255,255,.05); }
.mp-tab.active {
  color:#d4a84b;border-color:rgba(212,168,75,.25);
  background:rgba(212,168,75,.06);
}
.mp-tab-badge {
  background:rgba(212,168,75,.18);color:#d4a84b;
  font-size:9px;padding:1px 5px;border-radius:10px;font-weight:600;
}

.mp-content { flex:1;overflow-y:auto;padding:16px 24px 24px; }

.mp-grid {
  display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:12px;
}
.mp-card {
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  border-radius:12px;padding:16px;
  display:flex;flex-direction:column;gap:10px;
  animation:cardIn .3s ease both;
  transition:border-color .15s,background .15s;
}
.mp-card:hover { border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.05); }
.mp-card--wanted { border-color:rgba(212,168,75,.2);background:rgba(212,168,75,.03); }
@keyframes cardIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

.mp-card-head { display:flex;align-items:center;justify-content:space-between;gap:8px; }
.mp-type-chip {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(245,240,232,.38);
}
.mp-price { font-size:11px;font-weight:600;color:#d4a84b; }
.mp-card-title { font-size:13px;font-weight:600;color:#f5f0e8;line-height:1.35; }
.mp-card-desc { font-size:11px;color:rgba(245,240,232,.5);line-height:1.55;flex:1; }
.mp-card-foot { display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px; }
.mp-tags { display:flex;flex-wrap:wrap;gap:4px; }
.mp-tag {
  font-size:9px;padding:2px 7px;border-radius:20px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);
  color:rgba(245,240,232,.42);
}
.mp-trust-bar { display:flex;flex-wrap:wrap;gap:4px; }
.mp-trust-badge {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;padding:2px 7px;border-radius:10px;letter-spacing:.03em;
  border:1px solid rgba(255,255,255,.07);
}
.mp-trust-badge--ok   { color:#4caf82;background:rgba(76,175,130,.1);border-color:rgba(76,175,130,.2); }
.mp-trust-badge--warn { color:#e8a838;background:rgba(232,168,56,.1);border-color:rgba(232,168,56,.2); }
.mp-trust-badge--muted { color:rgba(245,240,232,.3);background:rgba(255,255,255,.04); }

.mp-action-btn {
  font-size:10px;padding:5px 10px;border-radius:6px;
  border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.07);
  color:#d4a84b;cursor:pointer;font:inherit;flex-shrink:0;white-space:nowrap;
  transition:background .12s,border-color .12s;
}
.mp-action-btn:hover { background:rgba(212,168,75,.14);border-color:rgba(212,168,75,.5); }

.mp-gap {
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;gap:14px;padding:60px 24px;
}
.mp-gap-icon { font-size:28px;color:rgba(212,168,75,.4); }
.mp-gap-title { font-family:'Georgia',serif;font-size:18px;color:#f5f0e8;font-weight:400; }
.mp-gap-body { font-size:12px;color:rgba(245,240,232,.45);max-width:400px;line-height:1.65; }
.mp-gap-actions { display:flex;gap:8px;margin-top:4px; }
`
