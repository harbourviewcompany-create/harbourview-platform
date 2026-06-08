import type { Metadata } from 'next'
import { MobileCountrySelection } from '@/components/harbourview/MobileCountrySelection'
import { resolveMarket } from '@/lib/dashboard/resolveMarket'

export const metadata: Metadata = {
  title: 'Harbourview | Select Your Market',
  description:
    'Select your market to begin. Harbourview routes regulated cannabis market access, intelligence, and reviewed introductions through a controlled market-first interface.',
  openGraph: {
    title: 'Harbourview | Select Your Market',
    description: 'Controlled market-access intelligence and reviewed commercial routing for regulated markets.',
  },
}

// Next.js 15: searchParams is now a Promise
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function firstParam(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export default async function MarketSelectionPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Resolve market from URL params — never fall back to a hardcoded country.
  // country= takes priority; fall back to the first entry of countries=
  const rawCountry =
    firstParam(params.country) ??
    firstParam(params.countries)?.split(',')[0]?.trim() ??
    null

  const market = rawCountry ? resolveMarket(rawCountry) : null

  // Pass the canonical code (uppercased, validated) or undefined (no pre-selection).
  // MobileCountrySelection will handle navigation on Continue via its own router.
  return (
    <MobileCountrySelection
      initialCountry={market?.code ?? undefined}
    />
  )
}
