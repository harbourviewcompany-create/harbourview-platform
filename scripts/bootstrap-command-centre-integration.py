#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def write(rel: str, content: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")

def replace_once(rel: str, old: str, new: str) -> None:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{rel}: expected one exact match, found {count}: {old[:120]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

def replace_regex_once(rel: str, pattern: str, replacement: str) -> None:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{rel}: expected one regex match, found {count}: {pattern[:120]!r}")
    path.write_text(updated, encoding="utf-8")

REGISTRY = r"""
export const COMMAND_CENTRE_PAGE_IDS = [
  'briefing',
  'digest',
  'personal-briefings',
  'access-pathway',
  'marketplace',
  'supply',
  'financing',
  'evidence',
  'education',
  'regulatory',
  'local-intel',
  'signals',
  'search',
  'watchlist',
  'settings',
  'genetics',
  'clinical',
  'compliance',
  'countries',
  'directories',
  'assistant',
  'documents',
  'events',
  'experts',
  'banking',
  'notifications',
  'kyb',
  'prices',
  'logistics',
  'jobs',
  'insurance',
  'licences',
  'trade-calc',
  'organization',
  'talent',
] as const

export type CommandCentrePage = (typeof COMMAND_CENTRE_PAGE_IDS)[number]

export type CommandCentreNavItem = {
  id: CommandCentrePage
  label: string
  icon: string
  mobileMode?: 'page' | 'briefing-subtab' | 'signals-subtab' | 'education-subtab'
}

export type CommandCentreNavSection = {
  label?: string
  items: readonly CommandCentreNavItem[]
}

export const COMMAND_CENTRE_DESKTOP_NAV: readonly CommandCentreNavSection[] = [
  {
    items: [
      { id: 'briefing', label: 'Briefing Room', icon: '◎' },
      { id: 'digest', label: 'Daily Digest', icon: '❑' },
      { id: 'personal-briefings', label: 'My Briefings', icon: '◌' },
      { id: 'marketplace', label: 'Marketplace', icon: '⊞' },
      { id: 'supply', label: 'Supply', icon: '▦' },
      { id: 'signals', label: 'Intelligence', icon: '≋' },
      { id: 'search', label: 'Signal Search', icon: '⌕' },
      { id: 'watchlist', label: 'Watchlist', icon: '◈', mobileMode: 'signals-subtab' },
    ],
  },
  {
    label: 'Market Access',
    items: [
      { id: 'access-pathway', label: 'Access Pathway', icon: '⬡', mobileMode: 'briefing-subtab' },
      { id: 'regulatory', label: 'Regulatory Watch', icon: '◷', mobileMode: 'signals-subtab' },
      { id: 'local-intel', label: 'Local Intel', icon: '◉', mobileMode: 'briefing-subtab' },
      { id: 'evidence', label: 'Research', icon: '⊟', mobileMode: 'education-subtab' },
      { id: 'compliance', label: 'Compliance', icon: '◫', mobileMode: 'briefing-subtab' },
    ],
  },
  {
    label: 'Trade & Commerce',
    items: [
      { id: 'financing', label: 'Trade Financing', icon: '¤' },
      { id: 'prices', label: 'Price Intel', icon: '⊕' },
      { id: 'trade-calc', label: 'Trade Calculator', icon: '⊜' },
      { id: 'logistics', label: 'Logistics', icon: '⬡' },
      { id: 'banking', label: 'Banking', icon: '⊟' },
      { id: 'insurance', label: 'Insurance', icon: '⊡' },
    ],
  },
  {
    label: 'Network & Industry',
    items: [
      { id: 'talent', label: 'Talent', icon: '✦' },
      { id: 'jobs', label: 'Jobs Board', icon: '◉' },
      { id: 'directories', label: 'Directories', icon: '⊚' },
      { id: 'experts', label: 'Expert Directory', icon: '⊚' },
      { id: 'events', label: 'Events', icon: '◷' },
    ],
  },
  {
    label: 'Compliance & Legal',
    items: [
      { id: 'genetics', label: 'Genetics', icon: '⊕' },
      { id: 'clinical', label: 'Clinical', icon: '⚕' },
      { id: 'licences', label: 'Licences', icon: '◨' },
      { id: 'kyb', label: 'KYB / Verify', icon: '◫' },
      { id: 'countries', label: 'Countries', icon: '⊗' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'education', label: 'Education', icon: '◇' },
      { id: 'assistant', label: 'AI Assistant', icon: '◈' },
      { id: 'notifications', label: 'Notifications', icon: '◎' },
      { id: 'documents', label: 'Documents', icon: '⊡' },
      { id: 'organization', label: 'Organization', icon: '⊙' },
      { id: 'settings', label: 'Settings', icon: '⊙' },
    ],
  },
]

export const COMMAND_CENTRE_MOBILE_NAV: readonly CommandCentreNavItem[] = [
  { id: 'briefing', label: 'Briefing', icon: '◎' },
  { id: 'digest', label: 'Digest', icon: '❑' },
  { id: 'personal-briefings', label: 'My Briefs', icon: '◌' },
  { id: 'signals', label: 'Intel', icon: '≋' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'marketplace', label: 'Market', icon: '⊞' },
  { id: 'supply', label: 'Supply', icon: '▦' },
  { id: 'financing', label: 'Finance', icon: '¤' },
  { id: 'directories', label: 'Directory', icon: '⊚' },
  { id: 'talent', label: 'Talent', icon: '✦' },
  { id: 'education', label: 'Learn', icon: '◇' },
  { id: 'genetics', label: 'Genetics', icon: '⊕' },
  { id: 'clinical', label: 'Clinical', icon: '⚕' },
]

export const COMMAND_CENTRE_MOBILE_SUBTAB_PAGES: Readonly<Record<string, CommandCentrePage>> = {
  watchlist: 'signals',
  regulatory: 'signals',
  evidence: 'education',
  compliance: 'briefing',
  'local-intel': 'briefing',
  'access-pathway': 'briefing',
}

const PAGE_SET = new Set<string>(COMMAND_CENTRE_PAGE_IDS)

const ALIASES: Readonly<Record<string, CommandCentrePage>> = {
  overview: 'briefing',
  briefing: 'briefing',
  briefings: 'personal-briefings',
  'my-briefings': 'personal-briefings',
  personal: 'personal-briefings',
  intel: 'signals',
  intelligence: 'signals',
  signal: 'signals',
  'signal-search': 'search',
  marketplace: 'marketplace',
  market: 'marketplace',
  supplies: 'supply',
  finance: 'financing',
  'trade-finance': 'financing',
  pathway: 'access-pathway',
  pathways: 'access-pathway',
  directory: 'directories',
  professionals: 'directories',
  suppliers: 'directories',
}

export function normalizeCommandCentrePage(raw: string | null | undefined): CommandCentrePage | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/_/g, '-')
  if (PAGE_SET.has(key)) return key as CommandCentrePage
  return ALIASES[key] ?? null
}

export function buildCommandCentreHref(
  page: CommandCentrePage,
  context?: { country?: string | null; role?: string | null },
): string {
  const params = new URLSearchParams()
  const country = context?.country?.trim().toUpperCase()
  const role = context?.role?.trim()
  if (country && country !== 'GLOBAL') params.set('country', country)
  if (role) params.set('role', role)
  if (page !== 'briefing') params.set('page', page)
  const query = params.toString()
  return query ? `/dashboard?${query}` : '/dashboard'
}

export const COMMAND_CENTRE_REQUIRED_MODULES: readonly CommandCentrePage[] = [
  'briefing',
  'digest',
  'personal-briefings',
  'signals',
  'search',
  'compliance',
  'marketplace',
  'supply',
  'talent',
  'genetics',
  'clinical',
  'watchlist',
  'access-pathway',
  'financing',
  'directories',
]
"""

INTEGRATED_PAGES = r"""
'use client'

import { useEffect, useMemo, useState } from 'react'
import FinancingInquiryForm from '@/app/marketplace/financing/FinancingInquiryForm'
import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'
import { createClient } from '@/lib/supabase/client'

type UnknownRow = readonly unknown[]
type MarketplaceRows = Partial<Record<string, readonly UnknownRow[]>>

type PageFrameProps = {
  page: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

function PageFrame({ page, eyebrow, title, description, children }: PageFrameProps) {
  return (
    <section className="cci-page" data-command-centre-page={page}>
      <style>{CSS}</style>
      <header className="cci-header">
        <div className="cci-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  )
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function text(record: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

function supplyCards(rows?: MarketplaceRows) {
  const sections = ['consumables', 'equipment', 'new-products', 'cannabis']
  return sections.flatMap(section =>
    (rows?.[section] ?? []).map((row, index) => ({
      id: String(row[7] ?? `${section}-${index}`),
      title: String(row[0] ?? 'Supply listing'),
      summary: String(row[1] ?? 'Reviewed supply opportunity'),
      jurisdiction: String(row[2] ?? 'Global'),
      category: String(row[3] ?? section),
      status: String(row[4] ?? 'Listed'),
    })),
  )
}

export function SupplyCommandPage({
  countryLabel,
  marketplaceRows,
}: {
  countryLabel: string
  marketplaceRows?: MarketplaceRows
}) {
  const cards = useMemo(() => supplyCards(marketplaceRows), [marketplaceRows])
  return (
    <PageFrame
      page="supply"
      eyebrow="Trade & Commerce"
      title="Supply"
      description={`Consumables, equipment, packaging and product supply available for ${countryLabel}.`}
    >
      {cards.length === 0 ? (
        <div className="cci-empty">No supply listings match the current jurisdiction context.</div>
      ) : (
        <div className="cci-grid">
          {cards.map(card => (
            <article className="cci-card" key={card.id}>
              <div className="cci-meta">{card.category} · {card.jurisdiction}</div>
              <h3>{card.title}</h3>
              <p>{card.summary}</p>
              <span className="cci-chip">{card.status}</span>
            </article>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

export function FinancingCommandPage({
  countryLabel,
  roleLabel,
}: {
  countryLabel: string
  roleLabel: string
}) {
  return (
    <PageFrame
      page="financing"
      eyebrow="Trade & Commerce"
      title="Trade Financing"
      description={`Submit a structured financing inquiry from the active ${countryLabel}${roleLabel ? ` · ${roleLabel}` : ''} context.`}
    >
      <FinancingInquiryForm />
    </PageFrame>
  )
}

function directoryCards(items: readonly unknown[], kind: string) {
  return items.map((item, index) => {
    const record = asRecord(item)
    return {
      id: text(record, ['id', 'slug'], `${kind}-${index}`),
      title: text(record, ['display_name', 'displayName', 'name', 'operator_name', 'legal_name'], `${kind} record`),
      summary: text(record, ['service_summary', 'description', 'public_summary', 'summary', 'specialties'], 'Reviewed directory record'),
      jurisdiction: text(record, ['jurisdiction_label', 'country_code', 'country_iso2', 'location_country'], 'Global'),
      status: text(record, ['verification_level', 'verification_status', 'status', 'review_status'], 'Reviewed'),
      kind,
    }
  })
}

export function DirectoriesCommandPage({
  countryLabel,
  professionals = [],
  serviceProviders = [],
  cannabisOperators = [],
}: {
  countryLabel: string
  professionals?: readonly unknown[]
  serviceProviders?: readonly unknown[]
  cannabisOperators?: readonly unknown[]
}) {
  const cards = useMemo(
    () => [
      ...directoryCards(professionals, 'Professional'),
      ...directoryCards(serviceProviders, 'Service provider'),
      ...directoryCards(cannabisOperators, 'Licensed operator'),
    ].filter(card => card.jurisdiction === 'Global' || card.jurisdiction === countryLabel || card.jurisdiction.length === 2),
    [professionals, serviceProviders, cannabisOperators, countryLabel],
  )
  return (
    <PageFrame
      page="directories"
      eyebrow="Network & Industry"
      title="Directories"
      description="Professionals, service providers and licensed operators presented inside the Command Centre context."
    >
      {cards.length === 0 ? (
        <div className="cci-empty">No directory records match the current context.</div>
      ) : (
        <div className="cci-grid">
          {cards.slice(0, 60).map(card => (
            <article className="cci-card" key={`${card.kind}-${card.id}`}>
              <div className="cci-meta">{card.kind} · {card.jurisdiction}</div>
              <h3>{card.title}</h3>
              <p>{card.summary}</p>
              <span className="cci-chip">{card.status}</span>
            </article>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

type PersonalBriefingPayload = {
  personal: {
    narrative: string
    source: string
    marketsCovered: string[]
  }
  activeRules: Array<{
    id: string
    rule_type: string
    keywords: string[]
  }>
  keywordPool: string[]
  synthBriefings: Array<{
    iso2: string
    briefing: {
      week_ending: string
      headline: string
      summary: string
      operator_implications?: string | null
      signal_count: number
    }
  }>
  staticBriefings: Array<{
    iso2: string
    briefing: Record<string, unknown>
  }>
}

export function PersonalBriefingsCommandPage({
  countryLabel,
  roleLabel,
}: {
  countryLabel: string
  roleLabel: string
}) {
  const [payload, setPayload] = useState<PersonalBriefingPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/personal-briefings', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error ?? `Briefing request failed (${response.status})`)
        return body as PersonalBriefingPayload
      })
      .then(body => { if (!cancelled) setPayload(body) })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Personal briefings could not be loaded') })
    return () => { cancelled = true }
  }, [])

  return (
    <PageFrame
      page="personal-briefings"
      eyebrow="Intelligence · Personalized"
      title="My Briefings"
      description={`Watch-rule-driven intelligence for ${countryLabel}${roleLabel ? ` · ${roleLabel}` : ''}.`}
    >
      {error && <div className="cci-empty cci-error">{error}</div>}
      {!error && !payload && <div className="cci-empty">Loading personalized briefings…</div>}
      {payload && (
        <div className="cci-stack">
          <article className="cci-card cci-feature">
            <div className="cci-meta">Personal synthesis · {payload.personal.source}</div>
            <h3>Current intelligence brief</h3>
            <p>{payload.personal.narrative}</p>
            <div className="cci-chips">
              {payload.personal.marketsCovered.map(market => <span className="cci-chip" key={market}>{market}</span>)}
            </div>
          </article>
          <div className="cci-grid">
            {payload.synthBriefings.map(({ iso2, briefing }) => (
              <article className="cci-card" key={`${iso2}-${briefing.week_ending}`}>
                <div className="cci-meta">{iso2} · week {briefing.week_ending}</div>
                <h3>{briefing.headline}</h3>
                <p>{briefing.summary}</p>
                {briefing.operator_implications && <p className="cci-emphasis">{briefing.operator_implications}</p>}
                <span className="cci-chip">{briefing.signal_count} signals</span>
              </article>
            ))}
            {payload.activeRules.map(rule => (
              <article className="cci-card" key={rule.id}>
                <div className="cci-meta">Active watch rule</div>
                <h3>{rule.rule_type.replace(/_/g, ' ')}</h3>
                <div className="cci-chips">
                  {rule.keywords.map(keyword => <span className="cci-chip" key={keyword}>{keyword}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </PageFrame>
  )
}

export function SearchCommandPage() {
  return (
    <PageFrame
      page="search"
      eyebrow="Intelligence"
      title="Signal Search"
      description="Semantic and keyword search over the reviewed quality-gated signal corpus."
    >
      <SignalSemanticSearch />
    </PageFrame>
  )
}

type TalentJob = {
  id: string
  title: string
  department: string | null
  location: string | null
  operator_name: string | null
  operator_verification_status: string | null
}

export function TalentCommandPage() {
  const [jobs, setJobs] = useState<TalentJob[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('talent_jobs_public')
      .select('id, title, department, location, operator_name, operator_verification_status')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) {
          setError(true)
          return
        }
        setJobs((data as TalentJob[] | null) ?? [])
      })
    return () => { cancelled = true }
  }, [])

  return (
    <PageFrame
      page="talent"
      eyebrow="Network & Industry"
      title="Talent"
      description="Open roles from operators and organizations represented in the Harbourview network."
    >
      {error && <div className="cci-empty cci-error">Talent roles could not be loaded.</div>}
      {!error && jobs === null && <div className="cci-empty">Loading open roles…</div>}
      {!error && jobs?.length === 0 && <div className="cci-empty">No open roles are currently published.</div>}
      {!error && jobs && jobs.length > 0 && (
        <div className="cci-grid">
          {jobs.map(job => (
            <article className="cci-card" key={job.id}>
              <div className="cci-meta">{job.location ?? 'Location pending'} · {job.department ?? 'General'}</div>
              <h3>{job.title}</h3>
              <p>{job.operator_name ?? 'Harbourview network operator'}</p>
              {job.operator_verification_status === 'verified' && <span className="cci-chip">Verified operator</span>}
            </article>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

const CSS = `
.cci-page { width:100%; min-width:0; padding:22px; color:#f5f0e8; }
.cci-header { margin:0 0 18px; }
.cci-eyebrow,.cci-meta { color:rgba(212,168,75,.78); font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
.cci-header h2 { margin:7px 0 8px; font-family:Georgia,serif; font-size:clamp(28px,4vw,42px); font-weight:400; }
.cci-header p,.cci-card p { color:rgba(245,240,232,.62); line-height:1.6; }
.cci-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; }
.cci-stack { display:grid; gap:14px; }
.cci-card,.cci-empty { min-width:0; padding:16px; border:1px solid rgba(255,255,255,.09); border-radius:14px; background:rgba(255,255,255,.035); }
.cci-card h3 { margin:7px 0; font-size:16px; color:#f5f0e8; }
.cci-card p { margin:7px 0 12px; font-size:13px; }
.cci-feature { border-color:rgba(212,168,75,.25); background:rgba(212,168,75,.055); }
.cci-chip { display:inline-flex; padding:4px 9px; border-radius:999px; border:1px solid rgba(212,168,75,.25); background:rgba(212,168,75,.08); color:#d4a84b; font-size:10px; }
.cci-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.cci-empty { color:rgba(245,240,232,.58); }
.cci-error { border-color:rgba(224,80,80,.25); color:#e08080; }
.cci-emphasis { color:rgba(245,240,232,.8)!important; }
.cci-page .fif-card { max-width:900px; }
.cci-page > div[style] { max-width:none!important; margin:0!important; padding:0!important; }
@media(max-width:767px){
  .cci-page { padding:0; }
  .cci-header h2 { font-size:30px; }
  .cci-grid { grid-template-columns:minmax(0,1fr); }
  .cci-page .fif-card { padding:18px 14px; }
}
`
"""

PERSONAL_DATA = r"""
import 'server-only'

import { getJurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import {
  generatePersonalBriefing,
  getSynthBriefingsForMarkets,
} from '@/lib/intelligence/personalBriefing'

const ISO2_RE = /^[A-Z]{2}$/

function extractIso2Hints(
  rules: Array<{ keywords: string[] }>,
  items: Array<{ jurisdiction: string | null }>,
): string[] {
  const found = new Set<string>()
  for (const item of items) {
    const jurisdiction = item.jurisdiction?.trim().toUpperCase()
    if (jurisdiction && ISO2_RE.test(jurisdiction)) found.add(jurisdiction)
  }
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      const normalized = keyword.trim().toUpperCase()
      if (ISO2_RE.test(normalized)) found.add(normalized)
    }
  }
  return Array.from(found).slice(0, 6)
}

export async function loadPersonalBriefingsData(userId: string) {
  const watchlist = await getWatchlistData(userId)
  const activeRules = watchlist.rules.filter(rule => rule.is_active)
  const iso2List = extractIso2Hints(activeRules, watchlist.items)
  const keywordPool = activeRules.flatMap(rule => rule.keywords).slice(0, 12)
  const ruleTypes = Array.from(new Set(activeRules.map(rule => rule.rule_type)))

  const [staticBriefings, synthBriefings, personal] = await Promise.all([
    Promise.all(
      iso2List.map(async iso2 => ({
        iso2,
        briefing: await getJurisdictionBriefing(iso2),
      })),
    ).then(rows => rows.filter(row => row.briefing)),
    getSynthBriefingsForMarkets(iso2List),
    generatePersonalBriefing({ keywords: keywordPool, iso2List, ruleTypes }),
  ])

  return {
    personal,
    activeRules,
    keywordPool,
    synthBriefings,
    staticBriefings,
  }
}

export type PersonalBriefingsData = Awaited<ReturnType<typeof loadPersonalBriefingsData>>
"""

PERSONAL_API = r"""
import { NextResponse } from 'next/server'
import { checkFeatureAccess } from '@/lib/billing/entitlements'
import { loadPersonalBriefingsData } from '@/lib/dashboard/personalBriefingsData'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const access = checkFeatureAccess({ app_metadata: user.app_metadata }, 'watchlist')
  if (!access.granted) {
    return NextResponse.json(
      { error: access.reason ?? 'Personal briefings require watchlist access' },
      { status: 403 },
    )
  }

  try {
    return NextResponse.json(await loadPersonalBriefingsData(user.id))
  } catch (error) {
    console.error('[personal-briefings] load failed', error)
    return NextResponse.json({ error: 'Personal briefings could not be loaded' }, { status: 500 })
  }
}
"""

REDIRECT_PAGE = r"""
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CommandCentreRedirect() {
  redirect('__HREF__')
}
"""

VITEST = r"""
import { describe, expect, it } from 'vitest'
import {
  COMMAND_CENTRE_DESKTOP_NAV,
  COMMAND_CENTRE_MOBILE_NAV,
  COMMAND_CENTRE_MOBILE_SUBTAB_PAGES,
  COMMAND_CENTRE_PAGE_IDS,
  COMMAND_CENTRE_REQUIRED_MODULES,
  buildCommandCentreHref,
  normalizeCommandCentrePage,
} from '@/lib/dashboard/commandCentreIntegration'

describe('Command Centre integration registry', () => {
  it('registers every required product module', () => {
    for (const page of COMMAND_CENTRE_REQUIRED_MODULES) {
      expect(COMMAND_CENTRE_PAGE_IDS).toContain(page)
    }
  })

  it('makes every required module discoverable on desktop and mobile', () => {
    const desktop = new Set(COMMAND_CENTRE_DESKTOP_NAV.flatMap(section => section.items.map(item => item.id)))
    const mobile = new Set(COMMAND_CENTRE_MOBILE_NAV.map(item => item.id))
    for (const page of COMMAND_CENTRE_REQUIRED_MODULES) {
      expect(desktop.has(page)).toBe(true)
      expect(mobile.has(page) || Boolean(COMMAND_CENTRE_MOBILE_SUBTAB_PAGES[page])).toBe(true)
    }
  })

  it('normalizes legacy and product-language deep links', () => {
    expect(normalizeCommandCentrePage('intel')).toBe('signals')
    expect(normalizeCommandCentrePage('my-briefings')).toBe('personal-briefings')
    expect(normalizeCommandCentrePage('trade_finance')).toBe('financing')
    expect(normalizeCommandCentrePage('suppliers')).toBe('directories')
    expect(normalizeCommandCentrePage('not-a-module')).toBeNull()
  })

  it('builds canonical context-preserving dashboard links', () => {
    expect(buildCommandCentreHref('search', { country: 'ca', role: 'importer' }))
      .toBe('/dashboard?country=CA&role=importer&page=search')
    expect(buildCommandCentreHref('briefing')).toBe('/dashboard')
  })
})
"""

ROUTE_TEST = r"""
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('authenticated deep-link contracts', () => {
  it('redirects legacy authenticated standalone pages into the Command Centre', () => {
    expect(read('app/dashboard/my-briefings/page.tsx')).toContain("/dashboard?page=personal-briefings")
    expect(read('app/dashboard/signals/search/page.tsx')).toContain("/dashboard?page=search")
  })

  it('uses one shared page registry in desktop, mobile and the dashboard loader', () => {
    expect(read('components/dashboard/CommandCentre.tsx')).toContain('COMMAND_CENTRE_DESKTOP_NAV')
    expect(read('components/dashboard/MobileCommandCentre.tsx')).toContain('COMMAND_CENTRE_MOBILE_NAV')
    expect(read('app/dashboard/page.tsx')).toContain('normalizeCommandCentrePage')
  })

  it('renders all newly integrated modules through both shells', () => {
    const desktop = read('components/dashboard/CommandCentre.tsx')
    const mobile = read('components/dashboard/MobileCommandCentre.tsx')
    for (const page of ['personal-briefings', 'search', 'supply', 'financing', 'directories', 'talent']) {
      expect(desktop).toContain(`case '${page}'`)
      expect(mobile).toContain(`case '${page}'`)
    }
  })
})
"""

E2E = r"""
import { expect, test, type Page } from '@playwright/test'

const viewports = [
  { name: '320', width: 320, height: 760 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 1000 },
] as const

const modules = [
  'briefing',
  'digest',
  'personal-briefings',
  'signals',
  'search',
  'marketplace',
  'supply',
  'financing',
  'directories',
  'talent',
  'genetics',
  'clinical',
] as const

async function signIn(page: Page) {
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  test.skip(!email || !password, 'E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required')
  await page.goto('/login?next=/dashboard')
  await page.locator('input[type="email"]').fill(email!)
  await page.locator('input[type="password"]').fill(password!)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
}

for (const viewport of viewports) {
  test(`Command Centre modules render without horizontal overflow at ${viewport.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)

    for (const module of modules) {
      await page.goto(`/dashboard?country=CA&page=${module}`)
      await page.waitForLoadState('networkidle').catch(() => undefined)
      const root = page.locator(viewport.width <= 767 ? '.hvm-app' : '.cc-app')
      await expect(root).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)
    }

    await page.goto('/dashboard?country=CA&page=supply')
    await page.waitForLoadState('networkidle').catch(() => undefined)
    await page.screenshot({
      path: `docs/control/evidence/command-centre-integration/command-centre-${viewport.name}.png`,
      fullPage: true,
    })
  })
}
"""

DOC = r"""
# Command Centre Integration Rule

Status: IMPLEMENTED ON FEATURE BRANCH — MERGE/DEPLOY NOT AUTHORIZED  
Date: 2026-08-02

## Governing rule

The authenticated Harbourview product has two canonical shells:

- Desktop: `components/dashboard/CommandCentre.tsx`
- Mobile: `components/dashboard/MobileCommandCentre.tsx`

Every authenticated customer capability must be discoverable and usable from the appropriate shell. A route, API, migration, database table, preview or standalone page does not constitute completed product delivery unless the capability is integrated into both shells or has an explicit mobile sub-tab mapping.

## Canonical module registry

`lib/dashboard/commandCentreIntegration.ts` is the single source of truth for:

- command page IDs;
- desktop navigation;
- mobile navigation;
- mobile sub-tab mappings;
- legacy page aliases; and
- canonical context-preserving dashboard URLs.

New authenticated capabilities must add their page ID, desktop placement, mobile placement, renderer, route contract and responsive test in the same pull request.

## Route boundaries

Preserved outside the shells:

- public acquisition, SEO, catalogue and entity-detail routes;
- authentication, account recovery and onboarding;
- admin/operator controls;
- API, callback, cron and infrastructure endpoints;
- public marketplace detail routes where anonymous access is intentional.

Authenticated standalone deep links must redirect to `/dashboard?page=<module>` and preserve context where available.

## Definition of done

A customer-facing authenticated capability is complete only when:

1. desktop Command Centre rendering exists;
2. mobile Command Centre rendering or an explicit mobile sub-tab mapping exists;
3. the module uses the same canonical data/permission boundary;
4. the URL is deep-linkable through the shared registry;
5. loading, error, empty and entitlement states are present;
6. route/navigation unit tests pass;
7. 320, 375, 390, 430, 768 and desktop browser checks pass; and
8. screenshots and evidence are attached before merge.

## Current migration ledger

| Capability / route | Previous state | Branch result | Canonical location |
|---|---|---|---|
| Briefing | Already integrated | Retained | `page=briefing` |
| Digest | Already integrated; mobile discoverability inconsistent | Integrated in shared nav | `page=digest` |
| Personal briefings `/dashboard/my-briefings` | Standalone authenticated page | Redirected and integrated with lazy authenticated loader | `page=personal-briefings` |
| Intel / Signals | Already integrated | Retained and registered | `page=signals` |
| Signal search `/dashboard/signals/search` | Standalone + mobile sub-tab | Canonical full module; legacy route redirects | `page=search` |
| Compliance | Desktop module; mobile briefing sub-tab | Explicit shared sub-tab mapping | `page=compliance` |
| Watchlist | Desktop module; mobile Intel sub-tab | Explicit shared sub-tab mapping with existing entitlement gate | `page=watchlist` |
| Access pathways | Desktop module; mobile briefing sub-tab | Explicit shared sub-tab mapping | `page=access-pathway` |
| Marketplace | Already integrated | Retained | `page=marketplace` |
| Supply | Public catalogue only / marketplace fragments | Integrated using canonical marketplace rows | `page=supply` |
| Financing | Standalone public inquiry | Reused inside both shells; public route preserved | `page=financing` |
| Directories | Fragmented professionals/operators/providers | Unified shell module using existing loaded DTOs | `page=directories` |
| Talent | Mobile-only placeholder; desktop union inactive | Integrated in both shells with shared live table query | `page=talent` |
| Genetics | Already integrated | Retained | `page=genetics` |
| Clinical | Already integrated | Retained | `page=clinical` |
| Education | Integrated but secondary | Registered in both shells | `page=education` |
| Public catalogue/entity pages | Intentional public/deep-detail surfaces | Preserved | Public routes |
| Admin, API and infrastructure | Non-customer shell surfaces | Preserved | Existing routes |

## Known dependency

Draft PR #1249 modifies country-aware redirect routes and `lib/dashboard/navigationRoutes.ts`. This branch avoids those files. Rebase and rerun route tests after #1249 is resolved.
"""

AUDIT_SCRIPT = r"""
#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const appRoot = path.join(root, 'app')
const pages = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    if (entry.isFile() && entry.name === 'page.tsx') pages.push(full)
  }
}
walk(appRoot)

function routeFor(file) {
  const rel = path.relative(appRoot, path.dirname(file)).replaceAll(path.sep, '/')
  return rel ? `/${rel}` : '/'
}

function classify(route, source) {
  if (route.startsWith('/admin')) return ['preserved', 'Admin/operator control']
  if (route.startsWith('/api')) return ['preserved', 'API/infrastructure']
  if (route === '/login' || route.startsWith('/auth') || route.startsWith('/account')) return ['preserved', 'Authentication/account']
  if (route === '/dashboard') return ['already integrated', 'Canonical responsive shell']
  if (source.includes("redirect('/dashboard?page=") || source.includes('redirect("/dashboard?page=')) return ['integrated', 'Authenticated deep link to canonical shell']
  if (route.startsWith('/dashboard')) return ['standalone', 'Authenticated dashboard route requiring explicit review']
  if (route.startsWith('/marketplace') || route.startsWith('/supply') || route.startsWith('/countries')) return ['preserved', 'Intentional public catalogue/entity surface']
  if (route.startsWith('/signals') || route.startsWith('/intelligence') || route.startsWith('/genetics') || route.startsWith('/network') || route.startsWith('/professionals') || route.startsWith('/compliance') || route.startsWith('/education')) {
    return ['partially integrated', 'Protected or tier-gated route; shell module exists while entity/detail route is preserved']
  }
  return ['preserved', 'Public or non-shell route']
}

const rows = pages
  .map(file => {
    const route = routeFor(file)
    const source = fs.readFileSync(file, 'utf8')
    const [status, rationale] = classify(route, source)
    return { route, status, rationale, file: path.relative(root, file).replaceAll(path.sep, '/') }
  })
  .sort((a, b) => a.route.localeCompare(b.route))

const counts = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] ?? 0) + 1
  return acc
}, {})

const markdown = [
  '# Command Centre Route Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  'This is a complete repository page-route inventory generated from every `app/**/page.tsx` file. Classification is architectural; protected/tier behavior remains governed by `proxy.ts`.',
  '',
  '## Counts',
  '',
  ...Object.entries(counts).sort().map(([status, count]) => `- ${status}: ${count}`),
  '',
  '## Ledger',
  '',
  '| Route | Classification | Rationale | Source |',
  '|---|---|---|---|',
  ...rows.map(row => `| \`${row.route}\` | ${row.status} | ${row.rationale} | \`${row.file}\` |`),
  '',
].join('\n')

fs.mkdirSync(path.join(root, 'docs/control'), { recursive: true })
fs.writeFileSync(path.join(root, 'docs/control/COMMAND_CENTRE_ROUTE_AUDIT.md'), markdown)
console.log(JSON.stringify({ routes: rows.length, counts }, null, 2))
"""

PLAYWRIGHT_CONFIG = r"""
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /command-centre-integration\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['json', { outputFile: 'docs/control/evidence/command-centre-integration/playwright-report.json' }]],
})
"""

write('lib/dashboard/commandCentreIntegration.ts', REGISTRY)
write('components/dashboard/pages/IntegratedCommandCentrePages.tsx', INTEGRATED_PAGES)
write('lib/dashboard/personalBriefingsData.ts', PERSONAL_DATA)
write('app/api/dashboard/personal-briefings/route.ts', PERSONAL_API)
write('tests/dashboard/commandCentreIntegration.test.ts', VITEST)
write('tests/dashboard/commandCentreRouteContracts.test.ts', ROUTE_TEST)
write('tests/e2e/command-centre-integration.spec.ts', E2E)
write('playwright.command-centre.config.ts', PLAYWRIGHT_CONFIG)
write('docs/control/COMMAND_CENTRE_INTEGRATION_RULE.md', DOC)
write('scripts/audit-command-centre-routes.mjs', AUDIT_SCRIPT)

write('app/dashboard/my-briefings/page.tsx', REDIRECT_PAGE.replace('__HREF__', '/dashboard?page=personal-briefings'))
write('app/dashboard/signals/search/page.tsx', REDIRECT_PAGE.replace('__HREF__', '/dashboard?page=search'))

aliases = {
    'app/dashboard/supply/page.tsx': '/dashboard?page=supply',
    'app/dashboard/financing/page.tsx': '/dashboard?page=financing',
    'app/dashboard/directories/page.tsx': '/dashboard?page=directories',
    'app/dashboard/talent/page.tsx': '/dashboard?page=talent',
    'app/dashboard/watchlist/page.tsx': '/dashboard?page=watchlist',
    'app/dashboard/pathways/page.tsx': '/dashboard?page=access-pathway',
}
for rel, href in aliases.items():
    if not (ROOT / rel).exists():
        write(rel, REDIRECT_PAGE.replace('__HREF__', href))

replace_once(
    'app/dashboard/page.tsx',
    "import type { RoleId } from '@/types/globe-router'\n",
    "import type { RoleId } from '@/types/globe-router'\nimport { normalizeCommandCentrePage } from '@/lib/dashboard/commandCentreIntegration'\n",
)
replace_regex_once(
    'app/dashboard/page.tsx',
    r"// Every redirected standalone route lands on one of these.*?function normalizePageParam\(raw: string \| null\): CommandPage \| null \{.*?\n\}",
    """// All authenticated dashboard routes resolve through the shared Command Centre registry.
function normalizePageParam(raw: string | null): CommandPage | null {
  return normalizeCommandCentrePage(raw)
}""",
)
replace_once(
    'app/dashboard/page.tsx',
    "urlPage === 'digest' ? fetchDailyDigest(20, ALL_COUNTRIES.find(c => c.iso2 === countryIso2)?.displayName) : Promise.resolve({ signals: [], window: 'recent' as const }),",
    "urlPage === 'digest' || urlPage === 'personal-briefings' ? fetchDailyDigest(20, ALL_COUNTRIES.find(c => c.iso2 === countryIso2)?.displayName) : Promise.resolve({ signals: [], window: 'recent' as const }),",
)

replace_once(
    'components/dashboard/CommandCentre.tsx',
    "import { MyListingsClient } from '@/app/marketplace/my-listings/MyListingsClient'\n",
    """import { MyListingsClient } from '@/app/marketplace/my-listings/MyListingsClient'
import {
  COMMAND_CENTRE_DESKTOP_NAV,
  type CommandCentrePage,
} from '@/lib/dashboard/commandCentreIntegration'
import {
  DirectoriesCommandPage,
  FinancingCommandPage,
  PersonalBriefingsCommandPage,
  SearchCommandPage,
  SupplyCommandPage,
  TalentCommandPage,
} from './pages/IntegratedCommandCentrePages'
""",
)
replace_regex_once(
    'components/dashboard/CommandCentre.tsx',
    r"export type CommandPage =\n.*?\n\nexport type \{ DigestWindow \}",
    """export type CommandPage = CommandCentrePage

export type { DigestWindow }""",
)
replace_regex_once(
    'components/dashboard/CommandCentre.tsx',
    r"type NavItem\s*=.*?const NAV_ITEMS_FLAT: NavItem\[\] = NAV_SECTIONS\.flatMap\(s => s\.items\)",
    """type NavItem = { id: CommandPage; label: string; icon: string }
type NavSection = { label?: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = COMMAND_CENTRE_DESKTOP_NAV.map(section => ({
  label: section.label,
  items: section.items.map(item => ({ id: item.id, label: item.label, icon: item.icon })),
}))

// Flat list — used by pageTitle and CommandPalette.
const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap(section => section.items)""",
)
replace_once(
    'components/dashboard/CommandCentre.tsx',
    """      case 'digest':
        return <DigestPageLazy country={country} region={region} role={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
""",
    """      case 'digest':
        return <DigestPageLazy country={country} region={region} role={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
      case 'personal-briefings':
        return <PersonalBriefingsCommandPage countryLabel={country.label} roleLabel={roleLabel} />
""",
)
replace_once(
    'components/dashboard/CommandCentre.tsx',
    """      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} pathwayData={pathwayData} cannabisOperators={cannabisOperators} operatorLicenceMatrix={operatorLicenceMatrix} pipeline={pipeline} onPageChange={handlePageChange} mySubmissions={mySubmissions} userEmail={userEmail} />
""",
    """      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} pathwayData={pathwayData} cannabisOperators={cannabisOperators} operatorLicenceMatrix={operatorLicenceMatrix} pipeline={pipeline} onPageChange={handlePageChange} mySubmissions={mySubmissions} userEmail={userEmail} />
      case 'supply':
        return <SupplyCommandPage countryLabel={country.label} marketplaceRows={marketplaceRows} />
      case 'financing':
        return <FinancingCommandPage countryLabel={country.label} roleLabel={roleLabel} />
""",
)
replace_once(
    'components/dashboard/CommandCentre.tsx',
    """      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} onPageChange={handlePageChange} />
""",
    """      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} watchlistData={watchlistData} onPageChange={handlePageChange} />
      case 'search':
        return <SearchCommandPage />
""",
)
replace_once(
    'components/dashboard/CommandCentre.tsx',
    """      case 'experts':
        return <ExpertDirectoryPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
""",
    """      case 'experts':
        return <ExpertDirectoryPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
      case 'directories':
        return <DirectoriesCommandPage countryLabel={country.label} professionals={professionals} serviceProviders={serviceProviders} cannabisOperators={cannabisOperators} />
""",
)
replace_once(
    'components/dashboard/CommandCentre.tsx',
    """      case 'jobs':
        return <JobsBoardPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
""",
    """      case 'talent':
        return <TalentCommandPage />
      case 'jobs':
        return <JobsBoardPage country={country} region={region} role={roleLabel} onPageChange={handlePageChange} />
""",
)

replace_once(
    'components/dashboard/MobileCommandCentre.tsx',
    "import ConfidentialIntakeForm from '@/app/intake/ConfidentialIntakeForm'\n",
    """import ConfidentialIntakeForm from '@/app/intake/ConfidentialIntakeForm'
import { COMMAND_CENTRE_MOBILE_NAV } from '@/lib/dashboard/commandCentreIntegration'
import {
  DirectoriesCommandPage,
  FinancingCommandPage,
  PersonalBriefingsCommandPage,
  SearchCommandPage,
  SupplyCommandPage,
  TalentCommandPage,
} from './pages/IntegratedCommandCentrePages'
""",
)
replace_once(
    'components/dashboard/MobileCommandCentre.tsx',
    "  initialPage?: string | null\n",
    "  initialPage?: CommandPage | null\n",
)
replace_regex_once(
    'components/dashboard/MobileCommandCentre.tsx',
    r"const MOBILE_NAV: \{ id: CommandPage; label: string; icon: string \}\[\] = \[.*?\]\n",
    """const MOBILE_NAV: { id: CommandPage; label: string; icon: string }[] =
  COMMAND_CENTRE_MOBILE_NAV.map(item => ({ id: item.id, label: item.label, icon: item.icon }))
""",
)
replace_once(
    'components/dashboard/MobileCommandCentre.tsx',
    """      case 'digest':
        return <DigestMobile country={country} roleLabel={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
""",
    """      case 'digest':
        return <DigestMobile country={country} roleLabel={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
      case 'personal-briefings':
        return <PersonalBriefingsCommandPage countryLabel={country.label} roleLabel={roleLabel} />
""",
)
replace_once(
    'components/dashboard/MobileCommandCentre.tsx',
    """      case 'marketplace':
        return <MarketplaceMobile country={country} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} cannabisOperators={cannabisOperators} operatorLicenceMatrix={operatorLicenceMatrix} pipeline={pipeline} mySubmissions={mySubmissions} userEmail={userEmail} />
""",
    """      case 'marketplace':
        return <MarketplaceMobile country={country} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} cannabisOperators={cannabisOperators} operatorLicenceMatrix={operatorLicenceMatrix} pipeline={pipeline} mySubmissions={mySubmissions} userEmail={userEmail} />
      case 'supply':
        return <SupplyCommandPage countryLabel={country.label} marketplaceRows={marketplaceRows} />
      case 'financing':
        return <FinancingCommandPage countryLabel={country.label} roleLabel={roleLabel} />
      case 'directories':
        return <DirectoriesCommandPage countryLabel={country.label} professionals={professionals} serviceProviders={serviceProviders} cannabisOperators={cannabisOperators} />
""",
)
replace_once(
    'components/dashboard/MobileCommandCentre.tsx',
    """      case 'signals':
        return <SignalsMobile country={country} signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} sourceCoverage={sourceCoverage} sub={signalsSub} />
""",
    """      case 'signals':
        return <SignalsMobile country={country} signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} sourceCoverage={sourceCoverage} sub={signalsSub} />
      case 'search':
        return <SearchCommandPage />
""",
)
replace_once(
    'components/dashboard/MobileCommandCentre.tsx',
    """      case 'talent':
        return <TalentMobile />
""",
    """      case 'talent':
        return <TalentCommandPage />
""",
)

package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
package['scripts']['test:command-centre'] = 'vitest run tests/dashboard/commandCentreIntegration.test.ts tests/dashboard/commandCentreRouteContracts.test.ts'
package['scripts']['audit:command-centre-routes'] = 'node scripts/audit-command-centre-routes.mjs'
package['scripts']['test:e2e:command-centre'] = 'playwright test --config=playwright.command-centre.config.ts'
package_path.write_text(json.dumps(package, indent=2) + '\n', encoding='utf-8')

import subprocess
subprocess.run(['node', 'scripts/audit-command-centre-routes.mjs'], cwd=ROOT, check=True)

evidence = ROOT / 'docs/control/EVIDENCE_LOG.md'
with evidence.open('a', encoding='utf-8') as handle:
    handle.write(
        '\n\n## 2026-08-02 — Command Centre Integration Rule (feature branch)\n\n'
        '- Scope: canonical desktop/mobile registry, integrated modules, authenticated deep-link redirects, route audit and responsive coverage.\n'
        '- Production: no merge, migration, deployment, alias movement or production write performed.\n'
        '- Validation: see `docs/control/evidence/COMMAND_CENTRE_INTEGRATION_2026-08-02.md` after CI execution.\n'
    )

print('Command Centre integration patch applied.')
