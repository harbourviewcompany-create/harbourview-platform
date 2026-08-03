'use client'

import React, { useEffect, useState } from 'react'
import CommandCentre from '@/components/dashboard/CommandCentre'
import MobileCommandCentreV2 from '@/components/dashboard/MobileCommandCentreV2'

type CommandCentreProps = React.ComponentProps<typeof CommandCentre>

export default function DashboardResponsiveShell(props: CommandCentreProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Keep the desktop shell as the server-rendered fallback. CSS prevents it
  // from flashing on mobile while viewport detection hydrates.
  if (isMobile === null) {
    return (
      <>
        <CommandCentre {...props} />
        <style>{`@media(max-width:767px){.hv-cc-root{display:none!important}}`}</style>
      </>
    )
  }

  return isMobile
    ? <MobileCommandCentreV2 {...props} />
    : <CommandCentre {...props} />
}
