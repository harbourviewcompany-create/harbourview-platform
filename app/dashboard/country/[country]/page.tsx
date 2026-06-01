import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { countIaSignalsByMarket } from '@/lib/intelligence-automation/db'
import { CountryIntelDashboard } from './CountryIntelDashboard'

type Props = { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const resolved = resolveCountryRouteParam(country)
  const displayName = resolved?.displayName ?? country.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  return {
    title: `${displayName} Country Dashboard | Harbourview`,
    description: `Harbourview ${displayName} country intelligence dashboard. Channel readiness, role-aware commercial routing, trade access, and operating readiness for regulated cannabis.`,
  }
}

export default async function CountryConsolePage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const signalCount = await countIaSignalsByMarket(country.displayName)

  return <CountryIntelDashboard country={country} signalCount={signalCount} />
}
