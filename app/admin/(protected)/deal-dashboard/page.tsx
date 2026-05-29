import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createClient } from '@/lib/server/supabaseRestClient'
import { DealDashboardClient } from '@/components/admin/deal-dashboard/DealDashboardClient'
import type {
  DealDashboardEvent,
  DealDashboardRecord,
} from '@/lib/introduction-routing/dealDashboard'

export const dynamic = 'force-dynamic'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function Page() {
  await requireAdminAuth()

  const client = getClient()
  let records: DealDashboardRecord[] = []
  let events: DealDashboardEvent[] = []

  if (client) {
    const { data: recordData } = await client
      .from<unknown>('genetics_routing_records')
      .select('*')
    const { data: eventData } = await client
      .from<unknown>('genetics_routing_events')
      .select('*')

    records = Array.isArray(recordData) ? (recordData as DealDashboardRecord[]) : []
    events = Array.isArray(eventData) ? (eventData as DealDashboardEvent[]) : []
  }

  return <DealDashboardClient records={records} events={events} />
}
