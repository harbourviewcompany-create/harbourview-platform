import type { Metadata } from 'next'
import Link from 'next/link'
import { complianceProducts } from '@/lib/compliance/products'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Compliance Products | Harbourview',
  description: 'Structured compliance outputs for regulated cannabis market entry, routing and documentation review.',
}

export default function ComplianceProductsPage() {
  return (
    <>
      <PublicHero
        eyebrow="Compliance"
        title="Compliance Products"
        compact
      >
        <p>Structured outputs designed to convert regulatory uncertainty into clear, actionable orientation without creating legal or compliance reliance.</p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Compliance Pathways" title="Structured review outputs." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {complianceProducts.map((product) => (
            <PublicCard key={product.slug} className="p-6 flex flex-col gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
              <h2 className="text-lg font-semibold text-[#f4f1eb]">{product.name}</h2>
              <p className="text-sm leading-7 text-white/58">{product.summary}</p>
              <p className="text-xs text-white/38">Best for: {product.bestFor}</p>
              <p className="text-xs text-white/38">Output: {product.output}</p>
              <ul className="text-xs text-white/44 space-y-1 list-disc pl-4">
                {product.riskControls.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <Link href={product.ctaHref} className="btn-marketplace mt-auto text-sm text-center justify-center">
                {product.ctaLabel}
              </Link>
            </PublicCard>
          ))}
        </div>
        <PublicCard muted className="mt-6 p-5 text-xs leading-7 text-white/44">
          {coreComplianceDisclaimer}
        </PublicCard>
      </PublicSection>
    </>
  )
}
