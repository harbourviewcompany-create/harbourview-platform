'use client'

import type { ReactNode } from 'react'
import type { CommandPage } from '../CommandCentre'
import { DESKTOP_PAGE_TRUST, type DesktopDataSource } from './desktopPageTrust'
import './DesktopPageShell.css'

export type { DesktopDataSource }

function formatRelativeFreshness(iso: string | null | undefined): string | null {
  if (!iso) return null
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return null
  const delta = Date.now() - ms
  if (delta < 0) return 'just now'
  const mins = Math.floor(delta / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return new Date(ms).toISOString().slice(0, 10)
}

const LABEL: Record<DesktopDataSource, string> = {
  live: 'Live',
  reference: 'Reference',
  mixed: 'Mixed',
}

/**
 * Production trust chrome for desktop Command pages.
 * Mirrors mobile SectionShell dataSource / freshness without forcing mobile layout.
 */
export function DesktopPageShell({
  page,
  dataSource: dataSourceOverride,
  updatedAt,
  badge,
  children,
}: {
  page: CommandPage
  dataSource?: DesktopDataSource
  updatedAt?: string | null
  badge?: ReactNode
  children: ReactNode
}) {
  const trust = DESKTOP_PAGE_TRUST[page]
  const dataSource = dataSourceOverride ?? trust?.dataSource
  const freshness = formatRelativeFreshness(updatedAt ?? null)

  return (
    <div
      className="cc-desktop-page-shell"
      data-page={page}
      data-source={dataSource}
    >
      {(dataSource || freshness || badge) ? (
        <div className="cc-desktop-trust-meta" aria-label="Page data trust">
          {dataSource ? (
            <span
              className={`cc-desktop-data-source cc-desktop-data-source--${dataSource}`}
              title={
                dataSource === 'live'
                  ? 'Backed by live pipeline / API data'
                  : dataSource === 'mixed'
                    ? 'Combines live signals with curated reference content'
                    : 'Curated or static reference content'
              }
            >
              {LABEL[dataSource]}
            </span>
          ) : null}
          {freshness ? (
            <span className="cc-desktop-freshness" title={updatedAt ?? undefined}>
              {freshness}
            </span>
          ) : null}
          {trust?.hint ? (
            <span className="cc-desktop-trust-hint">{trust.hint}</span>
          ) : null}
          {badge}
        </div>
      ) : null}
      {children}
    </div>
  )
}
