import { complianceServiceCategories } from '@/lib/compliance/serviceCategories'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'

export default function ComplianceServiceSupportPage() {
  return (
    <div className="page-container py-12 space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-gold font-semibold">Compliance Pathways</p>
        <h1 className="text-3xl font-bold text-navy">Service Support Categories</h1>
        <p className="max-w-3xl text-gray-700">
          Harbourview organizes compliance support by category so qualified operators can understand what type of specialist review may be required before entering a market, moving product or relying on documentation.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {complianceServiceCategories.map((category) => (
          <article key={category.slug} className="card p-5 space-y-3">
            <h2 className="text-xl font-semibold text-navy">{category.name}</h2>
            <p className="text-sm text-gray-700">{category.whoItHelps}</p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Typical issues</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                {category.typicalIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
            <a href={category.ctaHref} className="btn-outline">Request Support</a>
          </article>
        ))}
      </section>

      <p className="rounded border border-gold/40 bg-white p-4 text-sm text-gray-700">{coreComplianceDisclaimer}</p>
    </div>
  )
}
