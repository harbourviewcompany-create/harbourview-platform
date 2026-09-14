'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseMobileCommandTool } from '@/components/dashboard/mobile-command/contracts'
import InteractiveChartsPanel from '@/components/dashboard/charts/InteractiveChartsPanel'
import '@/components/dashboard/MobileCommandCentreWorkspaces.css'
import './MobileChartsWorkspace.css'

/**
 * Mobile mount for Interactive Charts (`?tool=charts`).
 * Desktop uses DesktopCommandWorkspace; mobile must host the panel itself
 * because DesktopCommandWorkspace is not rendered under max-width 767px
 * and is CSS-hidden on small viewports.
 */
export function MobileChartsWorkspace() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tool = parseMobileCommandTool(searchParams.get('tool'))

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tool')
    params.delete('listing')
    const returnTo = searchParams.get('returnTo')
    if (returnTo && returnTo.startsWith('/dashboard')) {
      router.replace(returnTo, { scroll: false })
      return
    }
    if (!params.get('section')) params.set('section', 'next-actions')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  if (tool !== 'charts') return null

  return (
    <div
      className="mobile-charts-workspace-layer"
      data-mobile-command-tool="charts"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Charts"
    >
      <section className="hvm2-workspace mobile-charts-workspace">
        <header className="hvm2-workspace-header">
          <div>
            <span>Command Centre</span>
            <h3>Interactive Charts</h3>
            <p>Market signal timelines and opportunity scores with drill-down routing.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close interactive charts">
            Close
          </button>
        </header>
        <InteractiveChartsPanel />
      </section>
    </div>
  )
}
