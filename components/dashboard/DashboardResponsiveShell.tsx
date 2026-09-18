import { headers } from 'next/headers'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import DashboardResponsiveShellClient from './DashboardResponsiveShellClient'

type DashboardResponsiveShellProps = MobileCommandCentreProps & {
  decisionIntelAccess?: FeatureAccess
}

function detectMobileUserAgent(userAgent: string | null): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent ?? '')
}

export async function DashboardResponsiveShell(props: DashboardResponsiveShellProps) {
  const requestHeaders = await headers()
  const initialIsMobile = detectMobileUserAgent(requestHeaders.get('user-agent'))

  return (
    <DashboardResponsiveShellClient
      {...props}
      initialIsMobile={initialIsMobile}
    />
  )
}

export { DashboardResponsiveShellContent } from './DashboardResponsiveShellClient'
export default DashboardResponsiveShell
