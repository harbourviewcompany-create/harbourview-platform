import { complianceProducts } from '@/lib/compliance/products'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'

export default function ComplianceProductsPage() {
  return (
    <div className="page-container py-12 space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-gold font-semibold">Compliance Pathways</p>
        <h1 className="text-3xl font-bold text-navy">Compliance Products</h1>
        <p className="max-w-3xl text-gray-700">
          Structured outputs designed to convert regulatory uncertainty into clear, actionable orientation without creating legal or compliance reliance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {complianceProducts.map((product) => (
          <article key={product.slug} className="card p-5 space-y-3">
            <h2 className="text-xl font-semibold text-navy">{product.name}</h2>
            <p className="text-sm text-gray-700">{product.summary}</p>
            <p className="text-xs text-gray-500">Best for: {product.bestFor}</p>
            <p className="text-xs text-gray-500">Output: {product.output}</p>
            <ul className="text-xs text-gray-600 list-disc pl-5">
              {product.riskControls.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <a href={product.ctaHref} className="btn-primary">{product.ctaLabel}</a>
          </article>
        ))}
      </section>

      <p className="rounded border border-gold/40 bg-white p-4 text-sm text-gray-700">{coreComplianceDisclaimer}</p>
    </div>
  )
}
