import { notFound } from 'next/navigation'
import { CountryShell } from '../_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
export default async function Page({ params }: { params: Promise<{ country: string }> }) { const { country } = await params; if (!resolveCountryRouteParam(country)) notFound(); return <CountryShell countryParam={country} section="intelligence" /> }
