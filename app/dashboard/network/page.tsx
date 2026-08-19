import { redirect } from 'next/navigation'
import NetworkCommandClient from '@/components/network/NetworkCommandClient'
import { getNetworkCommandForCurrentUser } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export default async function NetworkCommandPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const command = await getNetworkCommandForCurrentUser({
    countryIso2: firstParam(params.country),
    roleId: firstParam(params.role),
  })

  if (!command) redirect('/login?next=/dashboard/network')

  return <NetworkCommandClient initialData={command} />
}
