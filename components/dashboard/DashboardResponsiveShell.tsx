'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { DesktopDecisionIntelBridge } from '@/components/dashboard/DesktopDecisionIntelBridge'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import {
  COMMAND_CENTRE_MODULE_REGISTRY,
  normalizeCommandPage,
} from '@/lib/platform/commandCentreRegistry'

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
  ...props
}: MobileCommandCentreProps & { isMobile: boolean }) {
  const renderer = isMobile ? 'mobile' : 'desktop'

  return (
    <div
      data-dashboard-renderer={renderer}
      data-command-centre-renderer={renderer}
      data-command-centre-module-count={COMMAND_CENTRE_MODULE_REGISTRY.length}
    >
      {isMobile
        ? <MobileCommandCentreRebuild {...props} />
        : (
          <>
            <DesktopDecisionIntelBridge signals={props.signals} />
            <CommandCentre {...props} />
            <DesktopCommandWorkspace />
          </>
        )}
    </div>
  )
}

export default function DashboardResponsiveShell(props: MobileCommandCentreProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const normalizedProps = useMemo<MobileCommandCentreProps>(() => ({
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
