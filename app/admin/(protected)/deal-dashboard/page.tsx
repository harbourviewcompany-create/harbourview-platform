import { createClient } from '@supabase/supabase-js'
import { groupDealsByStatus } from '@/lib/introduction-routing/dealDashboard'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function Page() {
  const client = getClient()
  let records = []

  if (client) {
    const { data } = await client.from('genetics_routing_records').select('*')
    records = data || []
  }

  const grouped = groupDealsByStatus(records)

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Deal Dashboard</h1>
      {grouped.map((g) => (
        <div key={g.status} className="mt-6">
          <h2>{g.status}</h2>
          {g.records.map((r: any) => (
            <div key={r.id} className="border p-3 mt-2">
              {r.requester_company} - {r.score}
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}
