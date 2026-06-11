import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  resolveJurisdictionRoute,
  buildJurisdictionContract,
} from '@/lib/command-centre/jurisdictionRouteContext'
import { getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { JurisdictionBriefingPage } from '@/components/command-centre/JurisdictionBriefingPage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string; state: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country, stateSlug: state })
  if (!route) return { title: 'Jurisdiction Not Found | Harbourview' }
  const label = route.stateName ?? route.countryName
  return {
    title: `${label} Command Centre`,
    description: `Harbourview Command Centre for ${label}, ${route.countryName}.`,
  }
}

export default async function StateCommandCentrePage({ params }: Props) {
  const { country, state } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country, stateSlug: state })
  if (!route) notFound()

  // Fetch parent-country intel as the state-level data source
  const intel = await getCountryIntelProfile(route.countryIso2)
  const contract = buildJurisdictionContract(route, {
    publicSummary: intel?.public_summary ?? null,
  })

  return <JurisdictionBriefingPage contract={contract} />
}
