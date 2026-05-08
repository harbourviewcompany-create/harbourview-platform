import { complianceRegions } from '@/lib/compliance/regions'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'

export default function CompliancePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Compliance Pathways</h1>
      <p>Global compliance orientation and pathway intelligence for regulated cannabis operators.</p>

      <div className="grid gap-4">
        {complianceRegions.map((r) => (
          <a key={r.slug} href={`/compliance/regions/${r.slug}`} className="border p-4">
            <h2 className="font-semibold">{r.name}</h2>
            <p>{r.summary}</p>
          </a>
        ))}
      </div>

      <p className="text-sm opacity-70">{coreComplianceDisclaimer}</p>
    </div>
  )
}
