import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { SectionPageView } from '../_components'

type Props = { params: Promise<{ country: string }> }

export default async function EducationPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel = country.panels.education

  return (
    <SectionPageView
      country={country}
      section="education"
      panel={panel as typeof panel & Record<string, string>}
      sectionSpecific={{ label: 'Education status', value: panel.educationStatus }}
    />
  )
}
