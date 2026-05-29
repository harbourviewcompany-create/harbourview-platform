import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { SectionPageView } from '../_components'

type Props = { params: Promise<{ country: string }> }

export default async function OpportunitiesPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel = country.panels.opportunities

  return (
    <SectionPageView
      country={country}
      section="opportunities"
      panel={panel as typeof panel & Record<string, string>}
      sectionSpecific={{ label: 'Opportunity status', value: panel.opportunityStatus }}
    />
  )
}
