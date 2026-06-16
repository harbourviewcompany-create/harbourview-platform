'use client'

import React, { useEffect, useState } from 'react'
import CommandCentre from '@/components/dashboard/CommandCentre'
import MobileCommandCentre from '@/components/dashboard/MobileCommandCentre'

type CommandCentreProps = React.ComponentProps<typeof CommandCentre>

export default function DashboardResponsiveShell(props: CommandCentreProps) {
  // Start with null — render nothing until we know viewport size.
  // Avoids hydration mismatch and eliminates the double-DOM penalty.
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // SSR / pre-hydration: render desktop shell with CSS guard so crawlers and
  // initial paint are correct, then swap to the right component after mount.
  if (isMobile === null) {
    return (
      <>
        <CommandCentre {...props} />
        <style>{`@media(max-width:767px){.hv-cc-root{display:none!important}}`}</style>
      </>
    )
  }

  return isMobile
    ? <MobileCommandCentre {...props} />
    : <CommandCentre {...props} />
}
