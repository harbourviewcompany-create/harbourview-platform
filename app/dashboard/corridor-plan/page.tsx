import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { buildCorridorPlanToolHref } from '@/components/dashboard/mobile-command/contracts'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

/** Alias → canonical `/dashboard/tools/corridor-plan`. */
export default async function DashboardCorridorPlanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const user = await getAuthenticatedUser()
  const sp = await searchParams
  const origin = first(sp.origin) ?? 'CA'
  const destination = first(sp.destination) ?? 'DE'
  const product = first(sp.product)

  const href = buildCorridorPlanToolHref({ origin, destination, product })
  if (!user) redirect(`/login?next=${encodeURIComponent(href)}`)
  redirect(href)
}
