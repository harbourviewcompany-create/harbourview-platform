import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { CountryIntelDashboard } from './CountryIntelDashboard'

type Props = { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const resolved = resolveCountryRouteParam(country)
  const displayName = resolved?.displayName ?? country.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  return {
    title: `${displayName} Country Dashboard | Harbourview`,
    description: `Harbourview ${displayName} country intelligence dashboard. Channel readiness, partner landscape, operating requirements, and commercial routing for regulated cannabis.`,
  }
}

export default async function CountryConsolePage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()
  return <CountryIntelDashboard country={country} />
}
