import { notFound } from 'next/navigation'
import { getComplianceCountry } from '@/lib/compliance/countries'
import { maturityLabels, toSafeCountry } from '@/lib/compliance/safePublicCompliance'

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params
  const country = getComplianceCountry(slug)

  if (!country) notFound()

  const c = toSafeCountry(country)

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{c.country}</h1>
      <p>{maturityLabels[c.maturityLevel]}</p>
      <p>{c.pathwaySummary}</p>
      <p className="text-sm opacity-70">{c.disclaimer}</p>
    </div>
  )
}
