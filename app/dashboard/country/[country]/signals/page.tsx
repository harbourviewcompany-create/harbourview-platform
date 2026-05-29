import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { SectionPageView } from '../_components'

type Props = { params: Promise<{ country: string }> }

export default async function SignalsPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel = country.panels.signals

  return (
    <SectionPageView
      country={country}
      section="signals"
      panel={panel as typeof panel & Record<string, string>}
      sectionSpecific={{ label: 'Signal availability', value: panel.signalAvailability }}
    />
  )
}
