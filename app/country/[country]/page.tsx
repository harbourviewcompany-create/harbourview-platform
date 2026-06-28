import { redirect } from 'next/navigation'
import { resolveJurisdictionRoute } from '@/lib/command-centre/jurisdictionRouteContext'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string }> }

export default async function CountryRootPage({ params }: Props) {
  const { country } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country })
  if (!route) return notFound()
  // No role selected — redirect to importer as canonical default
  redirect(`/country/${country}/role/importer`)
}
