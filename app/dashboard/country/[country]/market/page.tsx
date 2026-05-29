import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { SectionPageView } from '../_components'

type Props = { params: Promise<{ country: string }> }

export default async function MarketPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel = country.panels.market

  return (
    <SectionPageView
      country={country}
      section="market"
      panel={panel as typeof panel & Record<string, string>}
      sectionSpecific={{ label: 'Market posture', value: panel.marketPosture }}
    />
  )
}
