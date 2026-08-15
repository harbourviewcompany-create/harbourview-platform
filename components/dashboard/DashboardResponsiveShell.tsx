'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { DesktopDecisionIntelBridge } from '@/components/dashboard/DesktopDecisionIntelBridge'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import {
  COMMAND_CENTRE_MODULE_REGISTRY,
  normalizeCommandPage,
} from '@/lib/platform/commandCentreRegistry'

type DashboardResponsiveShellProps = MobileCommandCentreProps & {
  decisionIntelAccess?: FeatureAccess
}

function CommandBootShell({ label }: { label: string }) {
  return (
    <main className="min-h-screen bg-[#020814] px-4 py-8 text-[#f5f1e8]" aria-busy="true" aria-label={label}>
      <div className="mx-auto max-w-lg animate-pulse rounded-2xl border border-[#c6a55a]/20 bg-[#07111f] p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#c6a55a]">Harbourview</p>
        <h1 className="mt-3 text-xl font-semibold">{label}</h1>
      </div>
    </main>
  )
}

const CommandCentre = dynamic(
  () => import('@/components/dashboard/CommandCentre'),
  {
    ssr: false,
    loading: () => <CommandBootShell label="Loading Command Centre" />,
  },
)

const DesktopCommandWorkspace = dynamic(
  () => import('@/components/dashboard/DesktopCommandWorkspace'),
  { ssr: false },
)

const MobileCommandCentreRebuild = dynamic(
  () => import('@/components/dashboard/MobileCommandCentreRebuild'),
  {
    ssr: false,
    loading: () => <CommandBootShell label="Loading Mobile Command Centre" />,
  },
)

export function DashboardResponsiveShellContent({
  isMobile,
  decisionIntelAccess,
  ...props
}: DashboardResponsiveShellProps & { isMobile: boolean }) {
  const renderer = isMobile ? 'mobile' : 'desktop'
  const desktopDossierSignals = useMemo(() => {
    const byId = new Map<string, (typeof props.signals)[number]>()
    for (const signal of [...props.signals, ...(props.digestSignals ?? [])]) {
      const key = `${signal.id}:${signal.decisionIntelEventId ?? ''}`
      if (!byId.has(key)) byId.set(key, signal)
    }
    return [...byId.values()]
  }, [props.signals, props.digestSignals])

  return (
    <div
      data-dashboard-renderer={renderer}
      data-command-centre-renderer={renderer}
      data-command-centre-module-count={COMMAND_CENTRE_MODULE_REGISTRY.length}
      // Without this the desktop wrapper collapses to zero height. `.cc-app` is
      // `position:fixed; inset:0`, and DesktopCommandWorkspace returns null
      // unless `?tool=` is present, so on every desktop page this element has
      // no in-flow children at all -- it measures 1440x0 while the Command
      // Centre paints full-screen behind it.
      //
      // That matters because this element is the renderer marker the E2E suite
      // queries, and a zero-area box is indistinguishable from a missing node
      // to Playwright's `:visible`, to accessibility tooling, and to element
      // screenshots. Claiming the viewport makes the marker's box agree with
      // what is actually on screen.
      //
      // It cannot move anything: the desktop child is out of flow, and the
      // mobile child already fills at least the viewport.
      style={{ minHeight: '100dvh' }}
    >
      {isMobile
        ? <MobileCommandCentreRebuild {...props} decisionIntelAccess={decisionIntelAccess} />
        : (
          <>
            <DesktopDecisionIntelBridge signals={desktopDossierSignals} access={decisionIntelAccess} />
            <CommandCentre {...props} />
            <DesktopCommandWorkspace />
          </>
        )}
    </div>
  )
}

export default function DashboardResponsiveShell(props: DashboardResponsiveShellProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const normalizedProps = useMemo<DashboardResponsiveShellProps>(() => ({
    ...props,
    initialPage: normalizeCommandPage(props.initialPage ?? null),
  }), [props])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    setIsMobile(media.matches)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  if (isMobile === null) {
    return (
      <div data-command-centre-module-count={COMMAND_CENTRE_MODULE_REGISTRY.length}>
        <CommandBootShell label="Loading Command Centre" />
      </div>
    )
  }

  return <DashboardResponsiveShellContent isMobile={isMobile} {...normalizedProps} />
}
