import type { Metadata } from 'next'
import Link from 'next/link'
import { complianceServiceCategories } from '@/lib/compliance/serviceCategories'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Compliance Service Support | Harbourview',
  description: 'Harbourview compliance support categories for regulated cannabis market entry, documentation and route review.',
}

export default function ComplianceServiceSupportPage() {
  return (
    <>
      <PublicHero eyebrow="Compliance" title="Service Support Categories" compact>
        <p>Harbourview organizes compliance support by category so qualified operators can understand what type of specialist review may be required before entering a market, moving product or relying on documentation.</p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Compliance Pathways" title="Specialist review categories." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {complianceServiceCategories.map((category) => (
            <PublicCard key={category.slug} className="p-6 flex flex-col gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
              <h2 className="text-lg font-semibold text-[#f4f1eb]">{category.name}</h2>
              <p className="text-sm leading-7 text-white/58">{category.whoItHelps}</p>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/36 mb-2">Typical issues</p>
                <ul className="space-y-1 list-disc pl-4 text-sm text-white/52">
                  {category.typicalIssues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              </div>
              <Link href={category.ctaHref} className="btn-intelligence mt-auto text-sm text-center justify-center">
                Request Support
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
