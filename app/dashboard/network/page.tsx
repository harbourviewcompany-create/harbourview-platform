import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

/**
 * Network is a Command Centre section, not a standalone page.
 * Preserve country/role context and land on the in-shell Network section.
 */
export default async function NetworkCommandPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = new URLSearchParams()
  next.set('section', 'network')
  next.set('page', 'experts')

  const country = firstParam(params.country)
  const role = firstParam(params.role)
  if (country) next.set('country', country)
  if (role) next.set('role', role)

  redirect(`/dashboard?${next.toString()}`)
}
