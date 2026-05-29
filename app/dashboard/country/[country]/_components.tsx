'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { IdentityRail } from '@/components/dashboard/IdentityRail'
import { SignalStrip } from '@/components/dashboard/SignalStrip'
import { ContextSummary } from '@/components/dashboard/ContextSummary'
import { CountrySelector } from '@/components/dashboard/CountrySelector'
import { PostListingModal } from '@/components/dashboard/PostListingModal'
import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { CountryDashboardSummary, DashboardPanelBase, DashboardSectionSlug } from '@/lib/dashboard/contracts'

// ── Tone maps (shared across shell + section view) ─────────────────────────
export const TONE_BG: Record<string, string> = {
  green: 'rgba(29,158,117,0.07)',
  blue:  'rgba(59,130,246,0.07)',
  gold:  'rgba(198,165,90,0.07)',
  amber: 'rgba(245,158,11,0.07)',
  slate: 'rgba(255,255,255,0.025)',
  red:   'rgba(239,68,68,0.07)',
}
export const TONE_BORDER: Record<string, string> = {
  green: 'rgba(29,158,117,0.25)',
  blue:  'rgba(59,130,246,0.25)',
  gold:  'rgba(198,165,90,0.25)',
  amber: 'rgba(245,158,11,0.25)',
  slate: 'rgba(255,255,255,0.08)',
  red:   'rgba(239,68,68,0.25)',
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

const SECTION_ICONS: Record<DashboardSectionSlug, string> = {
  market:        '📊',
  education:     '📚',
  compliance:    '⚖️',
  signals:       '📡',
  opportunities: '💡',
  intelligence:  '🔍',
  connections:   '🤝',
}

const SECTION_DESCRIPTIONS: Record<DashboardSectionSlug, string> = {
  market:        'Regulatory posture, import framework, market model, operator landscape.',
  education:     'Prescriber, patient, and operator education pathways and status.',
  compliance:    'GMP, packaging, labelling, and import compliance requirements.',
  signals:       'Curated regulatory, market, and trade intelligence signals.',
  opportunities: 'Reviewed commercial opportunity routing and intake.',
  intelligence:  'Analyst-reviewed country intelligence briefs and source methodology.',
  connections:   'Reviewed connection and counterparty routing for this jurisdiction.',
}

// ── CountryContextSync ─────────────────────────────────────────────────────
// Syncs the URL-resolved country into DashboardContext so IdentityRail / ContextSummary
// display the correct country when navigating directly to a country URL.
export function CountryContextSync({ iso2, name }: { iso2: string; name: string }) {
  const { setCountry, countryIso2 } = useDashboard()

  useEffect(() => {
    if (countryIso2 !== iso2) setCountry(iso2, name)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso2, name])

  return null
}

// ── CountryConsoleShell ────────────────────────────────────────────────────
export function CountryConsoleShell({
  country,
  children,
}: {
  country: CountryDashboardSummary
  children: React.ReactNode
}) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [postListingOpen, setPostListingOpen] = useState(false)
  const pathname = usePathname()

  const sections = Object.keys(country.panels) as DashboardSectionSlug[]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#03070d]">
      {/* Sync URL country → context */}
      <CountryContextSync iso2={country.iso2} name={country.displayName} />

      {/* Top rail */}
      <IdentityRail onMarketClick={() => setSelectorOpen(true)} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside
          className="flex w-56 flex-shrink-0 flex-col overflow-y-auto"
          style={{
            background: 'rgba(4,9,18,0.97)',
            borderRight: '1px solid rgba(198,165,90,0.12)',
          }}
        >
          {/* Country context card */}
          <div className="px-3 py-4">
            <ContextSummary onMarketClick={() => setSelectorOpen(true)} />
          </div>

          {/* Section nav */}
          <nav className="flex-1 px-2 pb-2">
            <p
              className="mb-1.5 px-1 text-[9px] uppercase tracking-[0.14em]"
              style={{ color: 'rgba(198,165,90,0.4)' }}
            >
              Console sections
            </p>

            {/* Overview link */}
            {(() => {
              const href = country.dashboardPath
              const isActive = pathname === href
              return (
                <Link
                  href={href}
                  className={`mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-all ${
                    isActive
                      ? 'bg-[rgba(198,165,90,0.1)] text-[#f0d39a]'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                  }`}
                >
                  <span>🏠</span>
                  <span>Overview</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c6a55a]" />}
                </Link>
              )
            })()}

            {/* Section links */}
            {sections.map((section) => {
              const href = `${country.dashboardPath}/${section}`
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              const available = country.routeAvailability[section]
              const panelBadge = getDashboardStatusBadge(country.panels[section].state)

              return (
                <Link
                  key={section}
                  href={available ? href : '#'}
                  aria-disabled={!available}
                  className={`mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-all ${
                    isActive
                      ? 'bg-[rgba(198,165,90,0.1)] text-[#f0d39a]'
                      : available
                      ? 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                      : 'cursor-not-allowed text-white/25'
                  }`}
                >
                  <span>{SECTION_ICONS[section]}</span>
                  <span className="flex-1">{SECTION_LABELS[section]}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#c6a55a]" />}
                  {!isActive && available && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: TONE_TEXT[panelBadge.tone], opacity: 0.5 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div
            className="px-3 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setPostListingOpen(true)}
              className="mb-2 w-full rounded-xl py-2 text-[11px] transition-all hover:opacity-90"
              style={{
                background: 'rgba(198,165,90,0.1)',
                border: '1px solid rgba(198,165,90,0.25)',
                color: '#F0D39A',
              }}
            >
              + Post listing
            </button>
            <Link
              href="/"
              className="block text-center text-[10px] transition-opacity hover:opacity-70"
              style={{ color: 'rgba(198,165,90,0.35)' }}
            >
              ← Return to globe
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Right signal strip (xl+) ── */}
        <aside className="hidden w-52 flex-shrink-0 overflow-y-auto xl:flex xl:flex-col">
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
// Shared section renderer used by every sub-section page.
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
  const badge = getDashboardStatusBadge(panel.state)
  const isUnavailable = panel.state === 'unavailable'

  return (
    <div className="min-h-full p-5">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-[11px]" style={{ color: 'rgba(198,165,90,0.45)' }}>
        <Link
          href={country.dashboardPath}
          className="transition-opacity hover:opacity-80"
        >
          {country.displayName}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.7)' }}>{SECTION_LABELS[section]}</span>
      </div>

      {/* Section header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-2xl">{SECTION_ICONS[section]}</span>
            <h1 className="font-serif text-2xl font-semibold text-white">
              {SECTION_LABELS[section]}
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(243,240,234,0.5)' }}>
            {SECTION_DESCRIPTIONS[section]}
          </p>
        </div>
        <span
          className="flex-shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
          style={{
            background: TONE_BG[badge.tone],
            borderColor: TONE_BORDER[badge.tone],
            color: TONE_TEXT[badge.tone],
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* State copy block */}
      <div
        className="mb-4 rounded-2xl border-l-2 p-4"
        style={{
          background: TONE_BG[badge.tone],
          borderLeftColor: TONE_BORDER[badge.tone],
        }}
      >
        <p className="mb-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: TONE_TEXT[badge.tone] }}>
          {panel.stateCopy.label}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.75)' }}>
          {panel.stateCopy.summary}
        </p>
      </div>

      {/* Public summary */}
      <div
        className="mb-4 rounded-2xl p-4"
        style={{ background: 'rgba(13,32,55,0.7)', border: '1px solid rgba(198,165,90,0.12)' }}
      >
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
          Public orientation
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.6)' }}>
          {panel.publicSummary}
        </p>
      </div>

      {/* Section-specific field (marketPosture, signalAvailability, etc.) */}
      {sectionSpecific && (
        <div
          className="mb-4 rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
            {sectionSpecific.label}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.55)' }}>
            {sectionSpecific.value}
          </p>
        </div>
      )}

      {/* Empty state */}
      {isUnavailable && (
        <div
          className="mb-4 rounded-2xl p-4 text-center"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(248,113,113,0.7)' }}>
            {panel.stateCopy.emptyState}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5">
        {panel.actions.map((action) => {
          const isPrimary = action.intent === 'section' || action.intent === 'primary-dashboard'
          const isReview  = action.intent === 'review-request'
          const isReturn  = action.intent === 'globe-return'

          if (isReturn) {
            return (
              <Link
                key={action.href}
                href="/"
                className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }}
              >
                {action.label}
              </Link>
            )
          }

          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
              style={
                isPrimary
                  ? { background: 'rgba(198,165,90,0.12)', border: '1px solid rgba(198,165,90,0.3)', color: '#F0D39A' }
                  : isReview
                  ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.55)' }
                  : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }
              }
            >
              {action.label}
            </Link>
          )
        })}
      </div>

      {/* Back to overview */}
      <div className="mt-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href={country.dashboardPath}
          className="text-[11px] transition-opacity hover:opacity-70"
          style={{ color: 'rgba(198,165,90,0.4)' }}
        >
          ← Back to {country.displayName} overview
        </Link>
      </div>
    </div>
  )
}
