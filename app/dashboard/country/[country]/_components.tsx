'use client'

import React, { type ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IdentityRail }    from '@/components/dashboard/IdentityRail'
import { SignalStrip }     from '@/components/dashboard/SignalStrip'
import { ContextSummary }  from '@/components/dashboard/ContextSummary'
import { CountrySelector } from '@/components/dashboard/CountrySelector'
import { PostListingModal } from '@/components/dashboard/PostListingModal'
import { useDashboard }    from '@/lib/dashboard/DashboardContext'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type {
  CountryDashboardSummary,
  DashboardPanelBase,
  DashboardSectionSlug,
} from '@/lib/dashboard/contracts'

// ── Design tokens ──────────────────────────────────────────────────────────
export const TONE_BG: Record<string, string> = {
  green: 'rgba(29,158,117,0.07)',
  blue:  'rgba(59,130,246,0.07)',
  gold:  'rgba(198,165,90,0.07)',
  amber: 'rgba(245,158,11,0.07)',
  slate: 'rgba(255,255,255,0.025)',
  red:   'rgba(239,68,68,0.07)',
}
export const TONE_BORDER: Record<string, string> = {
  green: 'rgba(29,158,117,0.28)',
  blue:  'rgba(59,130,246,0.28)',
  gold:  'rgba(198,165,90,0.28)',
  amber: 'rgba(245,158,11,0.28)',
  slate: 'rgba(255,255,255,0.09)',
  red:   'rgba(239,68,68,0.28)',
}
export const TONE_TEXT: Record<string, string> = {
  green: '#5dcaa5',
  blue:  '#7ec8f7',
  gold:  '#f4d27a',
  amber: '#fbbf24',
  slate: 'rgba(243,240,234,0.4)',
  red:   '#f87171',
}

export const SECTION_LABELS: Record<DashboardSectionSlug, string> = {
  market:        'Market posture',
  education:     'Education',
  compliance:    'Compliance',
  signals:       'Signals',
  opportunities: 'Opportunities',
  intelligence:  'Intelligence',
  connections:   'Connections',
}

// SVG icon set — rendered at size of parent container (use a sized flex wrapper)
export const SECTION_ICONS: Record<DashboardSectionSlug, ReactNode> = {
  market: (
    <svg viewBox="0 0 16 16" className="h-full w-full" aria-hidden="true">
      <rect x="1.5" y="9.5" width="2.5" height="5" rx="0.5" fill="currentColor"/>
      <rect x="6.75" y="6" width="2.5" height="8.5" rx="0.5" fill="currentColor"/>
      <rect x="12" y="2.5" width="2.5" height="12" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  education: (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 5.5v8.5"/>
      <path d="M8 5.5C6.5 4 4 3.5 2 4v8c2-.5 4.5.5 6 2"/>
      <path d="M8 5.5c1.5-1.5 4-2 6-1.5v8c-2-.5-4.5.5-6 2"/>
    </svg>
  ),
  compliance: (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2L13.5 4.5V9c0 3.5-2.5 5.5-5.5 6.5C5 14.5 2.5 12.5 2.5 9V4.5L8 2Z"/>
      <path d="M5.5 8.5l2 2 3-3"/>
    </svg>
  ),
  signals: (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="12.5" r="1.3" fill="currentColor" stroke="none"/>
      <path d="M4.8 9.2a4.5 4.5 0 0 1 6.4 0"/>
      <path d="M2.2 6.5a8 8 0 0 1 11.6 0"/>
    </svg>
  ),
  opportunities: (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 12.5L10 6"/>
      <path d="M6.5 6H10v3.5"/>
    </svg>
  ),
  intelligence: (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5"/>
      <path d="M9.8 9.8l3.7 3.7"/>
    </svg>
  ),
  connections: (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="2.5" r="1.8" fill="currentColor" stroke="none"/>
      <circle cx="2.5" cy="13" r="1.8" fill="currentColor" stroke="none"/>
      <circle cx="13.5" cy="13" r="1.8" fill="currentColor" stroke="none"/>
      <path d="M8 4.3l-5.5 7.5M8 4.3l5.5 7.5M4.3 13h7.4"/>
    </svg>
  ),
}

export const SECTION_DESCRIPTIONS: Record<DashboardSectionSlug, string> = {
  market:        'Regulatory posture, import framework, market model, operator landscape.',
  education:     'Prescriber, patient, and operator education pathways and status.',
  compliance:    'GMP, packaging, labelling, and import compliance requirements.',
  signals:       'Curated regulatory, market, and trade intelligence signals.',
  opportunities: 'Reviewed commercial opportunity routing and intake.',
  intelligence:  'Analyst-reviewed country intelligence briefs and source methodology.',
  connections:   'Reviewed connection and counterparty routing for this jurisdiction.',
}

// ── CountryContextSync ─────────────────────────────────────────────────────
export function CountryContextSync({ iso2, name }: { iso2: string; name: string }) {
  const { setCountry, countryIso2 } = useDashboard()
  useEffect(() => {
    if (countryIso2 !== iso2) setCountry(iso2, name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso2, name])
  return null
}

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({
  href,
  icon,
  label,
  isActive,
  available = true,
  dotColor,
}: {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  available?: boolean
  dotColor?: string
}) {
  return (
    <Link
      href={available ? href : '#'}
      aria-disabled={!available}
      className="mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12px] transition-all focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.35)]"
      style={
        isActive
          ? { background: 'rgba(198,165,90,0.1)', color: '#f0d39a', pointerEvents: 'none' }
          : !available
          ? { color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
          : { color: 'rgba(255,255,255,0.55)' }
      }
      onMouseEnter={(e) => {
        if (!isActive && available)
          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 leading-none">{label}</span>
      {isActive && <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#c6a55a' }} />}
      {!isActive && available && dotColor && (
        <span className="h-1.5 w-1.5 rounded-full opacity-45" style={{ background: dotColor }} />
      )}
    </Link>
  )
}

// ── CountryConsoleShell ────────────────────────────────────────────────────
export function CountryConsoleShell({
  country,
  children,
}: {
  country: CountryDashboardSummary
  children?: React.ReactNode
}) {
  const [selectorOpen,    setSelectorOpen]    = useState(false)
  const [postListingOpen, setPostListingOpen] = useState(false)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)
  const pathname = usePathname()
  const sections = Object.keys(country.panels) as DashboardSectionSlug[]

  // Derive current section label for mobile breadcrumb
  const lastSegment = pathname?.split('/').pop() as DashboardSectionSlug | undefined
  const currentLabel =
    lastSegment && lastSegment in SECTION_LABELS
      ? SECTION_LABELS[lastSegment]
      : 'Overview'

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: '#03070d' }}>
      <CountryContextSync iso2={country.iso2} name={country.displayName} />

      {/* Top rail */}
      <IdentityRail onMarketClick={() => setSelectorOpen(true)} />

      {/* Mobile sub-header */}
      <div
        className="flex items-center gap-3 px-4 py-2 md:hidden"
        style={{ borderBottom: '1px solid rgba(198,165,90,0.1)', background: 'rgba(4,9,18,0.97)' }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-[12px]"
          style={{ color: 'rgba(198,165,90,0.65)' }}
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
            <rect x="0" y="2" width="16" height="2" rx="1" />
            <rect x="0" y="7" width="16" height="2" rx="1" />
            <rect x="0" y="12" width="16" height="2" rx="1" />
          </svg>
          {country.displayName}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{currentLabel}</span>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className={`
            absolute inset-y-0 left-0 z-30 flex w-56 shrink-0 flex-col overflow-y-auto
            transition-transform duration-200 ease-in-out md:relative md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{
            background: 'rgba(4,9,18,0.98)',
            borderRight: '1px solid rgba(198,165,90,0.1)',
          }}
        >
          {/* Country context card */}
          <div className="px-3 pt-4 pb-3">
            <ContextSummary onMarketClick={() => { setSelectorOpen(true); setSidebarOpen(false) }} />
          </div>

          <div className="mx-3 mb-3" style={{ height: 1, background: 'rgba(198,165,90,0.08)' }} />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Console sections">
            <p className="mb-1 px-2.5 text-[9px] uppercase tracking-[0.16em]" style={{ color: 'rgba(198,165,90,0.35)' }}>
              Sections
            </p>

            <NavItem
              href={country.dashboardPath}
              icon="◎"
              label="Overview"
              isActive={pathname === country.dashboardPath}
            />

            {sections.map((section) => {
              const href     = `${country.dashboardPath}/${section}`
              const isActive = pathname === href || Boolean(pathname?.startsWith(`${href}/`))
              const available = country.routeAvailability[section]
              const badge    = getDashboardStatusBadge(country.panels[section].state)
              return (
                <NavItem
                  key={section}
                  href={href}
                  icon={SECTION_ICONS[section]}
                  label={SECTION_LABELS[section]}
                  isActive={isActive}
                  available={available}
                  dotColor={TONE_TEXT[badge.tone]}
                />
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => { setPostListingOpen(true); setSidebarOpen(false) }}
              className="mb-2 w-full rounded-xl py-2 text-[11px] font-medium transition-all hover:opacity-90"
              style={{
                background: 'rgba(198,165,90,0.09)',
                border: '1px solid rgba(198,165,90,0.22)',
                color: '#F0D39A',
              }}
            >
              + Post listing
            </button>
            <Link
              href="/"
              className="block text-center text-[10px] transition-opacity hover:opacity-70"
              style={{ color: 'rgba(198,165,90,0.3)' }}
            >
              ← Globe
            </Link>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-20 md:hidden"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Signal strip (xl+) ── */}
        <aside
          className="hidden w-52 shrink-0 overflow-y-auto xl:flex xl:flex-col"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        >
          <SignalStrip />
        </aside>
      </div>

      {/* Modals */}
      <CountrySelector open={selectorOpen} onClose={() => setSelectorOpen(false)} />
      <PostListingModal open={postListingOpen} onClose={() => setPostListingOpen(false)} />
    </div>
  )
}

// ── SectionPageView ────────────────────────────────────────────────────────
export function SectionPageView({
  country,
  section,
  panel,
  sectionSpecific,
}: {
  country: CountryDashboardSummary
  section: DashboardSectionSlug
  panel: DashboardPanelBase & Record<string, string>
  sectionSpecific?: { label: string; value: string }
}) {
  const badge        = getDashboardStatusBadge(panel.state)
  const isUnavailable = panel.state === 'unavailable'

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>
          Dashboard
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>
          {country.displayName}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>{SECTION_LABELS[section]}</span>
      </nav>

      {/* Section header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center" style={{ color: 'rgba(240,211,154,0.8)' }}>{SECTION_ICONS[section]}</span>
            <h1 className="font-serif text-2xl font-semibold text-white">{SECTION_LABELS[section]}</h1>
          </div>
          <p className="max-w-lg text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>
            {SECTION_DESCRIPTIONS[section]}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
          style={{
            background: TONE_BG[badge.tone],
            borderColor: TONE_BORDER[badge.tone],
            color: TONE_TEXT[badge.tone],
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* State copy */}
      <div
        className="mb-4 rounded-2xl border-l-2 px-4 py-3.5"
        style={{ background: TONE_BG[badge.tone], borderLeftColor: TONE_TEXT[badge.tone] }}
      >
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: TONE_TEXT[badge.tone] }}>
          {panel.stateCopy.label}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.78)' }}>
          {panel.stateCopy.summary}
        </p>
      </div>

      {/* Two-column content */}
      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        {/* Public orientation */}
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.1)' }}
        >
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
            Public orientation
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.58)' }}>
            {panel.publicSummary}
          </p>
        </div>

        {/* Section-specific field */}
        {sectionSpecific && (
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.4)' }}>
              {sectionSpecific.label}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.52)' }}>
              {sectionSpecific.value}
            </p>
          </div>
        )}
      </div>

      {/* Unavailable notice */}
      {isUnavailable && (
        <div
          className="mb-4 rounded-2xl px-4 py-3 text-center"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(248,113,113,0.65)' }}>
            {panel.stateCopy.emptyState}
          </p>
        </div>
      )}

      {/* Actions */}
      {panel.actions.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2.5">
          {panel.actions.map((action) => {
            const isPrimary = action.intent === 'section' || action.intent === 'primary-dashboard'
            const isReturn  = action.intent === 'globe-return'
            return (
              <Link
                key={action.href}
                href={isReturn ? '/' : action.href}
                className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.4)]"
                style={
                  isPrimary
                    ? { background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }
                    : { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }
                }
              >
                {action.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Back link */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link
          href={country.dashboardPath}
          className="text-[11px] transition-opacity hover:opacity-70"
          style={{ color: 'rgba(198,165,90,0.38)' }}
        >
          ← {country.displayName} overview
        </Link>
      </div>
    </div>
  )
}

// ── Legacy alias (tests use CountryDashboardShell) ─────────────────────────
// CountryConsoleShell supersedes this. Role-based personalization
// (selectedRole/selectedLayer) was an earlier design that was never wired
// to actually render role-specific content here -- superseded by
// /country/[country]/role/[role] (CommandCentre), which is the real,
// working role-personalization surface. Props removed accordingly.
export function CountryDashboardShell({ country, children }: {
  country: CountryDashboardSummary
  children?: React.ReactNode
}) {
  return <CountryConsoleShell country={country}>{children}</CountryConsoleShell>
}
