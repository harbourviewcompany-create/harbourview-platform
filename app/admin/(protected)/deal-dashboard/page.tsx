import { createClient } from '@supabase/supabase-js'
import { DealDashboardClient } from '@/components/admin/deal-dashboard/DealDashboardClient'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function Page() {
  const client = getClient()
  let records = []
  let events = []

  if (client) {
    const { data: recordData } = await client.from('genetics_routing_records').select('*')
    const { data: eventData } = await client.from('genetics_routing_events').select('*')

    records = recordData || []
    events = eventData || []
  }

  return <DealDashboardClient records={records} events={events} />
}
