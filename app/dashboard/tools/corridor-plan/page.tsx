import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { DashboardToolRouteClient } from '@/components/dashboard/command-workspace/DashboardToolRouteClient'

export const metadata: Metadata = {
  title: 'Corridor execution plan | Harbourview',
  description: 'Command Centre corridor execution plan — orientation-level logistics workstreams.',
}

export const dynamic = 'force-dynamic'

export default async function CorridorPlanToolPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/dashboard/tools/corridor-plan')

  return <DashboardToolRouteClient tool="corridor-plan" />
}
