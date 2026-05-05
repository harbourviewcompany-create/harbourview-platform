import { getComplianceRegion } from '@/lib/compliance/regions'
import { getCountriesByRegion } from '@/lib/compliance/safePublicCompliance'

export default function RegionPage({ params }: { params: { region: string } }) {
  const region = getComplianceRegion(params.region)
  const countries = getCountriesByRegion(params.region as any)

  if (!region) return <div>Not found</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">{region.name}</h1>
      <p>{region.summary}</p>

      <div className="grid gap-3">
        {countries.map((c) => (
          <a key={c.slug} href={`/compliance/country-pathways/${c.slug}`} className="border p-3">
            {c.country}
          </a>
        ))}
      </div>
    </div>
  )
}
