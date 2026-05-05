import { getComplianceCountry } from '@/lib/compliance/countries'
import { maturityLabels } from '@/lib/compliance/safePublicCompliance'

export default function CountryPage({ params }: { params: { country: string } }) {
  const c = getComplianceCountry(params.country)

  if (!c) return <div>Not found</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{c.country}</h1>
      <p>{maturityLabels[c.maturityLevel]}</p>
      <p>{c.pathwaySummary}</p>
      <p className="text-sm opacity-70">{c.disclaimer}</p>
    </div>
  )
}
