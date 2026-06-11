'use client'

import React from 'react'
import CommandCentre from '@/components/dashboard/CommandCentre'
import MobileCommandCentre from '@/components/dashboard/MobileCommandCentre'

type CommandCentreProps = React.ComponentProps<typeof CommandCentre>

export default function DashboardResponsiveShell(props: CommandCentreProps) {
  return (
    <>
      <div className="hv-dashboard-desktop-shell" aria-hidden={false}>
        <CommandCentre {...props} />
      </div>
      <div className="hv-dashboard-mobile-shell" aria-hidden={false}>
        <MobileCommandCentre {...props} />
      </div>
      <style jsx global>{`
        .hv-dashboard-mobile-shell { display: none; }
        .hv-dashboard-desktop-shell { display: block; }

        @media (max-width: 767px) {
          .hv-dashboard-desktop-shell { display: none !important; }
          .hv-dashboard-mobile-shell { display: block !important; }
          html, body { overflow-x: hidden; }
        }

        @media (min-width: 768px) {
          .hv-dashboard-desktop-shell { display: block !important; }
          .hv-dashboard-mobile-shell { display: none !important; }
        }
      `}</style>
    </>
  )
}
