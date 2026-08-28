import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MobileCountrySelection } from '@/components/harbourview/MobileCountrySelection'
import { resolveMarket } from '@/lib/dashboard/resolveMarket'
import { CANDIDATE_B_DEFAULT_COUNTRY } from '@/lib/harbourview/countries'

export const metadata: Metadata = {
  title: 'Harbourview | Select Your Market',
  description:
    'Select your market to begin. Harbourview routes regulated cannabis market access, intelligence, and reviewed introductions through a controlled market-first interface.',
  openGraph: {
    title: 'Harbourview | Select Your Market',
    description: 'Controlled market-access intelligence and reviewed commercial routing for regulated markets.',
  },
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default async function MarketSelectionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawCountry =
    firstParam(params.country) ??
    firstParam(params.countries)?.split(',')[0]?.trim() ??
    CANDIDATE_B_DEFAULT_COUNTRY
  const market = rawCountry ? resolveMarket(rawCountry) : null

  return (
    <Suspense fallback={null}>
      <MobileCountrySelection initialCountry={market?.code ?? CANDIDATE_B_DEFAULT_COUNTRY} />
    </Suspense>
  )
}
