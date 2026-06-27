import { redirect } from 'next/navigation'
import { resolveJurisdictionRoute } from '@/lib/command-centre/jurisdictionRouteContext'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string; state: string }> }

export default async function StateRootPage({ params }: Props) {
  const { country, state } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country, stateSlug: state })
  if (!route) return notFound()
  // No role selected — redirect to parent country + importer as canonical default
  redirect(`/country/${country}/role/importer`)
}
