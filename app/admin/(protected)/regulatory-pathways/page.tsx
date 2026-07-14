import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listPathwayCountries, listLicenceCountries } from '@/lib/admin/regulatoryPathwaysQuery'

export const dynamic = 'force-dynamic'

// Small local map so the index reads with names, not just ISO codes — this
// page only needs the handful of countries the seeded dataset actually
// covers, not the full countries table.
const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Germany', GB: 'United Kingdom', AU: 'Australia', CA: 'Canada', NL: 'Netherlands',
  PT: 'Portugal', TH: 'Thailand', IL: 'Israel', CO: 'Colombia', ZA: 'South Africa',
  MT: 'Malta', LU: 'Luxembourg', CZ: 'Czech Republic', NZ: 'New Zealand', MX: 'Mexico',
  US: 'United States', CH: 'Switzerland', PL: 'Poland', GR: 'Greece', UY: 'Uruguay',
  BR: 'Brazil', AR: 'Argentina', PE: 'Peru', JM: 'Jamaica', LS: 'Lesotho',
}

export default async function RegulatoryPathwaysIndexPage() {
  await requireAdminAuth()

  const [pathwaysResult, licencesResult] = await Promise.all([
    listPathwayCountries(),
    listLicenceCountries(),
  ])

  const isFixture = !pathwaysResult.ok || !licencesResult.ok

  const pathwayCounts = new Map<string, number>()
  if (pathwaysResult.ok) {
    for (const row of pathwaysResult.data) {
      pathwayCounts.set(row.iso_alpha2, (pathwayCounts.get(row.iso_alpha2) ?? 0) + 1)
    }
  }

  const licenceCounts = new Map<string, number>()
  if (licencesResult.ok) {
    for (const row of licencesResult.data) {
      licenceCounts.set(row.country_iso2, (licenceCounts.get(row.country_iso2) ?? 0) + 1)
    }
  }

  const allCountries = [...new Set([...pathwayCounts.keys(), ...licenceCounts.keys()])].sort()

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence Automation</p>
        <h2 className="mt-1 text-2xl font-semibold">Regulatory Pathways &amp; Licensing</h2>
        <p className="mt-1 text-sm text-[#F5F1E8]/55">
          Full regulatory access pathways, product-format legal limits, and operator licensing by country.
          The public compliance pages show an orientation-level summary only — use this view to fulfil
          &ldquo;Request Country Intelligence&rdquo; submissions.
        </p>
      </div>

      {isFixture && (
        <FixtureBanner
          isFixture
          label="SUPABASE_SERVICE_ROLE_KEY not set — cannot read regulatory_pathways / operator_licences."
        />
      )}

      {allCountries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-[#F5F1E8]/40 text-sm">No regulatory pathway or licensing data found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[#F5F1E8]/40 text-xs uppercase tracking-[0.12em]">
                <th className="px-4 py-3 text-left font-medium">Country</th>
                <th className="px-4 py-3 text-right font-medium">Pathways</th>
                <th className="px-4 py-3 text-right font-medium">Licensed operators</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allCountries.map(iso2 => (
                <tr key={iso2} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {COUNTRY_NAMES[iso2] ?? iso2}
                    <span className="ml-2 text-[#F5F1E8]/35 text-xs">{iso2}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#F5F1E8]/65">{pathwayCounts.get(iso2) ?? 0}</td>
                  <td className="px-4 py-3 text-right text-[#F5F1E8]/65">{licenceCounts.get(iso2) ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/regulatory-pathways/${iso2}`}
                      className="text-[#C6A55A] text-xs hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
