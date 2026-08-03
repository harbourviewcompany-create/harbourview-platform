'use client'

import React, { useEffect, useState } from 'react'
import CommandCentre from '@/components/dashboard/CommandCentre'
import CommandCentreIntegrationGateway from '@/components/dashboard/CommandCentreIntegrationGateway'
import MobileCommandCentre from '@/components/dashboard/MobileCommandCentre'

type CommandCentreProps = React.ComponentProps<typeof CommandCentre>

export default function DashboardResponsiveShell(props: CommandCentreProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    setIsMobile(media.matches)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  if (isMobile === null) {
    return (
      <>
        <CommandCentre {...props} />
        <style>{`@media(max-width:767px){.hv-cc-root{display:none!important}}`}</style>
      </>
    )
  }

  return (
    <CommandCentreIntegrationGateway isMobile={isMobile} dashboardProps={props}>
      {isMobile ? <MobileCommandCentre {...props} /> : <CommandCentre {...props} />}
    </CommandCentreIntegrationGateway>
  )
}
