import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  resolveJurisdictionRoute,
  buildJurisdictionContract,
} from '@/lib/command-centre/jurisdictionRouteContext'
import { getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { JurisdictionBriefingPage } from '@/components/command-centre/JurisdictionBriefingPage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country })
  if (!route) return { title: 'Jurisdiction Not Found | Harbourview' }
  return {
    title: `${route.countryName} Command Centre`,
    description: `Harbourview Command Centre for ${route.countryName} — reviewed market routing, intelligence, and operator data.`,
  }
}

export default async function CountryCommandCentrePage({ params }: Props) {
  const { country } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country })
  if (!route) notFound()

  const intel = await getCountryIntelProfile(route.countryIso2)
  const contract = buildJurisdictionContract(route, {
    publicSummary: intel?.public_summary ?? null,
  })

  return <JurisdictionBriefingPage contract={contract} />
}
