'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { DashboardResponsiveShellProps } from '@/components/dashboard/DashboardResponsiveShell.types'
import { COMMAND_CENTRE_MODULE_REGISTRY } from '@/lib/platform/commandCentreRegistry'
import { CommandBootShell } from '@/components/dashboard/CommandBootShell'

const DesktopCommandCentre = dynamic(
  () => import('@/components/dashboard/CommandCentre').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <CommandBootShell label="Loading Command Centre" />,
  },
)

const MobileCommandCentreRebuild = dynamic(
  () => import('@/components/dashboard/MobileCommandCentreRebuild').then(mod => mod.default),
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
    const byId = new Map<string, DashboardSignal>()
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
    >
      {isMobile ? (
        <MobileCommandCentreRebuild {...props} decisionIntelAccess={decisionIntelAccess} />
      ) : (
        <DesktopCommandCentre {...props} decisionIntelAccess={decisionIntelAccess} decisionIntelDossierSignals={desktopDossierSignals} />
      )}
    </div>
  )
}

export default function DashboardResponsiveShell(props: DashboardResponsiveShellProps) {
  const isMobile = props.viewport === 'mobile'
  return <DashboardResponsiveShellContent {...props} isMobile={isMobile} />
}
