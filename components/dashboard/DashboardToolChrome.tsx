'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { PRIMARY_NAV } from '@/components/dashboard/mobile-command/contracts'
import './DashboardToolChrome.css'

const SECTION_QUERY: Record<string, string> = {
  overview: 'overview',
  marketplace: 'marketplace',
  'weekly-signals': 'weekly-signals',
  'next-actions': 'next-actions',
}

type DashboardToolChromeProps = {
  children: ReactNode
  /** Active primary tab highlight while on a tool route */
  activeTab?: 'overview' | 'marketplace' | 'weekly-signals' | 'next-actions'
  title?: string
}

/**
 * Lightweight Command Centre chrome for standalone tool routes under
 * `/dashboard/tools/*`. Keeps the four primary tabs always visible; only the
 * main panel scrolls. Query country/role are preserved when returning to tabs.
 */
export function DashboardToolChrome({
  children,
  activeTab = 'next-actions',
  title = 'Operator tool',
}: DashboardToolChromeProps) {
  const searchParams = useSearchParams()
  const country = searchParams.get('country')
  const role = searchParams.get('role')

  function tabHref(sectionId: string) {
    const params = new URLSearchParams()
    params.set('section', SECTION_QUERY[sectionId] ?? sectionId)
    if (country) params.set('country', country)
    if (role) params.set('role', role)
    return `/dashboard?${params.toString()}`
  }

  return (
    <div className="hvm-tool-chrome" data-dashboard-tool-chrome="true">
      <header className="hvm-tool-chrome-header">
        <p className="hvm-tool-chrome-brand">Harbourview</p>
        <h1 className="hvm-tool-chrome-title">{title}</h1>
      </header>

      <main className="hvm-tool-chrome-main">{children}</main>

      <nav className="hvm-tool-chrome-nav" aria-label="Command Centre">
        {PRIMARY_NAV.map((item) => {
          const active = item.id === activeTab
          return (
            <Link
              key={item.id}
              href={tabHref(item.id)}
              className={active ? 'active' : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <small>{item.label}</small>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
