import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { CountryConsoleShell } from './_components'

type Props = {
  children: React.ReactNode
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) return { title: 'Country not found | Harbourview' }

  return {
    title: `${country.displayName} | Harbourview Intelligence`,
    description: country.publicSummary,
  }
}

export default async function CountryLayout({ params, children }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)

  if (!country) notFound()

  return (
    <CountryConsoleShell country={country}>
      {children}
    </CountryConsoleShell>
  )
}
