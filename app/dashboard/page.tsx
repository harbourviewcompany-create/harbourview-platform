'use client'

import { useState } from 'react'
import { DashboardProvider }    from '@/lib/dashboard/DashboardContext'
import { IdentityRail }         from '@/components/dashboard/IdentityRail'
import { ContextSummary }       from '@/components/dashboard/ContextSummary'
import { CountrySelector }      from '@/components/dashboard/CountrySelector'
import { CountryBriefModal }    from '@/components/dashboard/CountryBriefModal'
import { PostListingModal }      from '@/components/dashboard/PostListingModal'
import { DashListingCard, DashListingItem } from '@/components/dashboard/DashListingCard'
import { SignalStrip }          from '@/components/dashboard/SignalStrip'
import { StatusBadge }          from '@/components/dashboard/StatusBadge'
import Link                     from 'next/link'

// ── Fixture listings (will come from Supabase in next iteration) ─────────────
const LISTINGS: DashListingItem[] = [
  {
    id:       '1',
    category: 'Supply · Flower / Biomass',
    title:    'EU-GMP certified THC flower — 500kg available, indoor grown, Canadian origin',
    country:  'Canada',
    status:   'Recreational',
    body:     'Indoor cultivar, COA available, EU-GMP facility certified. Available Q2 2026. Target markets: Germany, Netherlands, UK. Minimum order 50kg.',
    hvScore:  94,
    age:      'Listed 2 days ago',
    type:     'supply',
    locked:   false,
    href:     '/marketplace/cannabis-inventory',
  },
  {
    id:       '2',
    category: 'Demand · Procurement',
    title:    'Seeking consistent genetics supply — Colombian or Portuguese origin preferred, 2T annually',
    country:  'Germany',
    status:   'Medical active',
    body:     'EU importer seeking stable genetics agreement, 2 tonnes annually minimum. EU-GMP preferred. COA and stability data required.',
    hvScore:  89,
    age:      'Listed 4 days ago',
    type:     'demand',
    locked:   false,
    href:     '/marketplace/wanted',
  },
  {
    id:       '3',
    category: 'Supply · Extracts / Oil',
    title:    'Full-spectrum CO₂ extract, distillate and isolate — Israeli origin, EU-GMP facility',
    country:  'Israel',
    status:   'Medical',
    body:     'Vertically integrated Israeli operator offering CO₂ extracts, THC distillate and CBD isolate. EU-GMP certified. Available for pharmaceutical and medical markets.',
    hvScore:  87,
    age:      'Listed 1 week ago',
    type:     'supply',
    locked:   false,
    href:     '/marketplace/cannabis-inventory',
  },
  {
    id:       '4',
    category: 'Equipment · Extraction',
    title:    'Seeking GMP-grade extraction line — decommissioned or surplus, any EU jurisdiction',
    country:  'Netherlands',
    status:   'Active market',
    body:     'Operator seeking CO₂ or ethanol extraction equipment, GMP-grade, budget €300k–€800k. Must include installation documentation.',
    hvScore:  76,
    age:      'Listed 3 days ago',
    type:     'equipment',
    locked:   true,
    href:     '/marketplace/processing-equipment',
  },
  {
    id:       '5',
    category: 'Supply · Genetics / Seeds',
    title:    'High-CBD certified seed genetics — 12 proprietary cultivars, Portugal-origin',
    country:  'Portugal',
    status:   'Medical · Export',
    body:     'Licensed Portuguese breeding operation offering 12 high-CBD / balanced cultivars. Phytosanitary certificates available.',
    hvScore:  82,
    age:      'Listed 5 days ago',
    type:     'supply',
    locked:   true,
    href:     '/marketplace/genetics',
  },
  {
    id:       '6',
    category: 'Supply · Biomass',
    title:    'Colombian-grown outdoor biomass — GACP certified, large volume, competitive pricing',
    country:  'Colombia',
    status:   'Export active',
    body:     'Large-volume GACP biomass from Colombian licensed cultivator. EU-GMP extraction facility partner available.',
    hvScore:  80,
    age:      'Listed 1 week ago',
    type:     'supply',
    locked:   true,
    href:     '/marketplace/cannabis-inventory',
  },
]

const MARKET_STRIP = [
  { name: 'Germany',     status: 'Medical only',  score: 91, color: '#378add' },
  { name: 'Australia',   status: 'Medical only',  score: 88, color: '#378add' },
  { name: 'Netherlands', status: 'Recreational',  score: 82, color: '#1d9e75' },
  { name: 'UK',          status: 'Medical only',  score: 78, color: '#378add' },
]

type FilterType = 'all' | 'supply' | 'demand' | 'equipment'

function DashboardInner() {
  const [selectorOpen,   setSelectorOpen]   = useState(false)
  const [postModalOpen,  setPostModalOpen]  = useState(false)
  const [briefIso2,      setBriefIso2]      = useState<string | null>(null)
  const [briefName,      setBriefName]      = useState<string | null>(null)
  const [filter,         setFilter]         = useState<FilterType>('all')

  const filtered = filter === 'all' ? LISTINGS : LISTINGS.filter(l => l.type === filter)

  function openBrief(iso2: string, name: string) {
    setBriefIso2(iso2)
    setBriefName(name)
  }
  function closeBrief() {
    setBriefIso2(null)
    setBriefName(null)
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'supply',    label: 'Supply' },
    { key: 'demand',    label: 'Demand' },
    { key: 'equipment', label: 'Equipment' },
  ]

  return (
    <>
      {/* ── IDENTITY RAIL ─────────────────────────────────────────────── */}
      <IdentityRail onMarketClick={() => setSelectorOpen(true)} />

      {/* ── THREE-COLUMN BODY ─────────────────────────────────────────── */}
      <div
        className="grid min-h-0"
        style={{
          gridTemplateColumns: '220px 1fr 280px',
          height: 'calc(100vh - 52px)',
        }}
      >
        {/* LEFT COLUMN */}
        <aside
          className="flex flex-col gap-4 overflow-y-hidden px-3.5 py-4"
          style={{ borderRight: '1px solid rgba(198,165,90,0.15)' }}
        >
          {/* Market context */}
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              Your market
            </p>
            <ContextSummary onMarketClick={() => setSelectorOpen(true)} />
          </div>

          {/* Activity */}
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              Your activity
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'My listings',     count: 0, dot: 'bg-yellow-400' },
                { label: 'Requests sent',   count: 0, dot: 'bg-amber-400' },
                { label: 'Watched markets', count: 3, dot: 'bg-emerald-400' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-all hover:bg-white/[0.04]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${item.dot}`} />
                  <span className="flex-1 text-[11px]" style={{ color: 'rgba(243,240,234,0.55)' }}>{item.label}</span>
                  <span
                    className="rounded-full px-1.5 text-[10px]"
                    style={{ background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              Quick actions
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setPostModalOpen(true)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[11px] font-medium transition-all"
                style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: 'var(--hv-champagne-300)' }}
              >
                <span>＋</span> Post a listing
              </button>
              {[
                { label: 'Submit a request →',       href: '/marketplace/wanted' },
                { label: 'Speak to Harbourview →',   href: '/contact' },
                { label: 'Explore all markets →',    href: '/markets' },
              ].map(a => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] transition-all hover:bg-white/[0.04]"
                  style={{ border: '1px solid rgba(198,165,90,0.15)', color: 'rgba(243,240,234,0.5)' }}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Subscribe CTA */}
          <div className="mt-auto border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="mb-3 text-[10px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.35)' }}>
              Subscribe to post listings, contact counterparties, and unlock full intelligence.
            </p>
            <Link
              href="/marketplace/sell"
              className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-medium transition-all"
              style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: 'var(--hv-champagne-300)' }}
            >
              ♛ View subscription tiers →
            </Link>
          </div>
        </aside>

        {/* CENTRE COLUMN */}
        <main className="flex flex-col gap-5 overflow-y-auto px-5 py-5">

          {/* Market strip */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-serif text-[16px]" style={{ color: 'var(--hv-text-primary)' }}>Active markets</span>
                <span className="ml-2 text-[11px]" style={{ color: 'rgba(243,240,234,0.35)' }}>— priority opportunities near your context</span>
              </div>
              <button
                onClick={() => setSelectorOpen(true)}
                className="rounded-full px-3 py-1 text-[10px] transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
              >
                All markets
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {MARKET_STRIP.map(m => (
                <button
                  key={m.name}
                  onClick={() => openBrief(m.name.slice(0,2).toUpperCase(), m.name)}
                  className="rounded-xl p-3 text-left transition-all hover:border-[rgba(198,165,90,0.3)]"
                  style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.15)' }}
                >
                  <p className="mb-1 text-[12px]" style={{ color: 'var(--hv-text-primary)' }}>{m.name}</p>
                  <StatusBadge label={m.status} />
                  <div className="mt-2 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: m.color }} />
                  </div>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.08em]" style={{ color: 'rgba(243,240,234,0.3)' }}>
                    Score {m.score}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Listings */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-serif text-[16px]" style={{ color: 'var(--hv-text-primary)' }}>Supply &amp; demand</span>
                <span className="ml-2 text-[11px]" style={{ color: 'rgba(243,240,234,0.35)' }}>— {filtered.length} active</span>
              </div>
              <div className="flex gap-1.5">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="rounded-full px-3 py-1 text-[10px] transition-all"
                    style={filter === f.key
                      ? { background: 'rgba(198,165,90,0.12)', border: '1px solid rgba(198,165,90,0.3)', color: 'var(--hv-champagne-300)' }
                      : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {filtered.map(item => (
                <DashListingCard key={item.id} item={item} />
              ))}
            </div>
          </section>

        </main>

        {/* RIGHT COLUMN */}
        <SignalStrip />
      </div>

      {/* MODALS */}
      <CountrySelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
      />
      <PostListingModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
      />
      <CountryBriefModal
        iso2={briefIso2}
        name={briefName}
        onClose={closeBrief}
      />
    </>
  )
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  )
}
