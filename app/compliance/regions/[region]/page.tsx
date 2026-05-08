import { notFound } from 'next/navigation'
import { getComplianceRegion } from '@/lib/compliance/regions'
import { getCountriesByRegion } from '@/lib/compliance/safePublicCompliance'
import type { ComplianceRegionSlug } from '@/lib/compliance/types'

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region: regionSlug } = await params
  const region = getComplianceRegion(regionSlug)

  if (!region) notFound()

  const countries = getCountriesByRegion(regionSlug as ComplianceRegionSlug)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">{region.name}</h1>
      <p>{region.summary}</p>

      <div className="grid gap-3">
        {countries.map((country) => (
          <a key={country.slug} href={`/compliance/country-pathways/${country.slug}`} className="border p-3">
            {country.country}
          </a>
        ))}
      </div>
    </div>
  )
}
