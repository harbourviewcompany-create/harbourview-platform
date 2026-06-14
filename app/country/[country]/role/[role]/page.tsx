import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveJurisdictionRoute } from '@/lib/command-centre/jurisdictionRouteContext'
import { buildLiveJurisdictionContract } from '@/lib/command-centre/jurisdictionBriefingData'
import { JurisdictionBriefingPage } from '@/components/command-centre/JurisdictionBriefingPage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string; role: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, role } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country, roleSlug: role })
  if (!route) return { title: 'Jurisdiction Not Found | Harbourview' }
  const suffix = route.roleName ? ` · ${route.roleName}` : ''
  return {
    title: `${route.countryName}${suffix} Command Centre`,
    description: `Harbourview Command Centre for ${route.countryName}${suffix}.`,
  }
}

export default async function RoleCommandCentrePage({ params }: Props) {
  const { country, role } = await params
  const route = resolveJurisdictionRoute({ countrySlug: country, roleSlug: role })
  if (!route) notFound()
  const contract = await buildLiveJurisdictionContract(route)
  return <JurisdictionBriefingPage contract={contract} />
}
