import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

/**
 * Clinical is a Command Centre section, not a standalone workspace page.
 * Preserve country/role/query context and land on the in-shell Clinical section.
 */
export default async function ClinicalWorkspaceRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = new URLSearchParams()
  next.set('section', 'clinical')
  next.set('page', 'clinical')

  const country = first(params.country) || first(params.jurisdiction)
  const role = first(params.role)
  const q = first(params.q)
  if (country) next.set('country', country)
  if (role) next.set('role', role)
  if (q) next.set('q', q)

  redirect(`/dashboard?${next.toString()}`)
}
