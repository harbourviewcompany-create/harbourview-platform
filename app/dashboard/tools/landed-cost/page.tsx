import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { DashboardToolRouteClient } from '@/components/dashboard/command-workspace/DashboardToolRouteClient'

export const metadata: Metadata = {
  title: 'Landed cost + sensitivity | Harbourview',
  description: 'Command Centre landed cost orientation calculator — not a commercial quote.',
}

export const dynamic = 'force-dynamic'

export default async function LandedCostToolPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/dashboard/tools/landed-cost')

  return <DashboardToolRouteClient tool="landed-cost" />
}
