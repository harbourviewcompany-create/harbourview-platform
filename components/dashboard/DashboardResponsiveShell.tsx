'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import CommandCentre from '@/components/dashboard/CommandCentre'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import {
  COMMAND_CENTRE_MODULE_REGISTRY,
  normalizeCommandPage,
} from '@/lib/platform/commandCentreRegistry'

const MobileCommandCentreRebuild = dynamic(
  () => import('@/components/dashboard/MobileCommandCentreRebuild'),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-[#020814] px-4 py-8 text-[#f5f1e8]" aria-busy="true" aria-label="Loading Mobile Command Centre">
        <div className="mx-auto max-w-lg animate-pulse rounded-2xl border border-[#c6a55a]/20 bg-[#07111f] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#c6a55a]">Harbourview</p>
          <h1 className="mt-3 text-xl font-semibold">Loading Mobile Command Centre</h1>
        </div>
      </main>
    ),
  },
)

export function DashboardResponsiveShellContent({
  isMobile,
  ...props
}: MobileCommandCentreProps & { isMobile: boolean }) {
  return (
    <div
      data-command-centre-renderer={isMobile ? 'mobile' : 'desktop'}
      data-command-centre-module-count={COMMAND_CENTRE_MODULE_REGISTRY.length}
    >
      {isMobile
        ? <MobileCommandCentreRebuild {...props} />
        : <CommandCentre {...props} />}
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
        <div className="hv-mobile-command-boot" aria-busy="true" aria-label="Loading Mobile Command Centre">
          <span>HARBOURVIEW</span>
          <strong>Loading Mobile Command</strong>
        </div>
        <CommandCentre {...normalizedProps} />
        <style>{`
          .hv-mobile-command-boot{display:none;min-height:100vh;background:#020814;color:#f5f1e8;padding:32px 16px}
          .hv-mobile-command-boot span{display:block;color:#c6a55a;font-size:11px;letter-spacing:.18em}
          .hv-mobile-command-boot strong{display:block;margin-top:12px;font-size:20px}
          @media(max-width:767px){.hv-cc-root{display:none!important}.hv-mobile-command-boot{display:block}}
        `}</style>
      </div>
    )
  }

  return <DashboardResponsiveShellContent isMobile={isMobile} {...normalizedProps} />
}
