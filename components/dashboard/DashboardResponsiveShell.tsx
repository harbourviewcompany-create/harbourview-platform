'use client'

import { useEffect, useState } from 'react'
import CommandCentre from '@/components/dashboard/CommandCentre'
import MobileCommandCentreRebuild from '@/components/dashboard/MobileCommandCentreRebuild'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'

export default function DashboardResponsiveShell(props: MobileCommandCentreProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    setIsMobile(media.matches)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  // Desktop remains the server-rendered fallback. The inline media rule avoids
  // showing the desktop shell while the mobile viewport hydrates.
  if (isMobile === null) {
    return (
      <>
        <CommandCentre {...props} />
        <style>{`@media(max-width:767px){.hv-cc-root{display:none!important}}`}</style>
      </>
    )
  }

  return isMobile
    ? <MobileCommandCentreRebuild {...props} />
    : <CommandCentre {...props} />
}
