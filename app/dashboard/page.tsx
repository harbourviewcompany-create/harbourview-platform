import type { Metadata } from 'next'
import { UniversalDashboard } from '@/components/dashboard/UniversalDashboard'
import { countries } from '@/lib/dashboard/countries'
import { publicMarketplaceListings } from '@/lib/marketplace/publicListings'
import type { DashboardClientRouteContext } from '@/lib/dashboard/dashboardClientTypes'
import type { GlobeLayerId, GlobeRouterMode, IntentId, RoleId } from '@/types/globe-router'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview user control center for marketplace, intelligence, education, signals, sources, requests, saved markets, listings and preferences.',
}

type DashboardHomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseCountries(value?: string) {
  return value ? value.split(',').map((entry) => entry.trim().toUpperCase()).filter(Boolean) : []
}

function parseRouteContext(params: Record<string, string | string[] | undefined>): DashboardClientRouteContext {
  const source = first(params.source) === 'globe_router' ? 'globe_router' : undefined
  const mode = first(params.mode) as GlobeRouterMode | undefined
  const countryIso2 = first(params.country)?.toUpperCase()
  const countries = parseCountries(first(params.countries))
  const roleId = first(params.role) as RoleId | undefined
  const intentId = first(params.intent) as IntentId | undefined
  const layerId = first(params.layer) as GlobeLayerId | undefined

  return {
    source,
    mode,
    countryIso2,
    countries: countries.length ? countries : countryIso2 ? [countryIso2] : [],
    roleId,
    intentId,
    layerId,
  }
}

export default async function DashboardHomePage({ searchParams }: DashboardHomePageProps) {
  const resolvedSearchParams = await searchParams
  const routeContext = parseRouteContext(resolvedSearchParams ?? {})

  return (
    <UniversalDashboard
      routeContext={routeContext}
      serverPreferences={null}
      countries={countries}
      listings={publicMarketplaceListings}
    />
  )
}
