import type { Metadata } from 'next'
import Link from 'next/link'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Supplier Discovery | Harbourview',
  description:
    'Reviewed supplier and service-provider profiles for regulated cannabis and adjacent supply-chain participants. Introductions routed through Harbourview review.',
}

const categories = [
  { title: 'Producers & LPs', body: 'Licensed producers, extraction facilities and regulated product suppliers.' },
  { title: 'Equipment & machinery', body: 'Cultivation, extraction, processing and packaging equipment suppliers.' },
  { title: 'Consumables & inputs', body: 'Packaging, lab supplies, cultivation inputs and operating supply.' },
  { title: 'Logistics & distribution', body: 'Import/export coordinators, cold-chain specialists and distribution partners.' },
  { title: 'Services & advisory', body: 'Compliance, regulatory, BD, clinical and market-access service providers.' },
  { title: 'Technology & data', body: 'Seed-to-sale, compliance software, analytics and operational technology.' },
]

export default function SupplierDirectoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Supplier Discovery"
        title="Reviewed supplier profiles for regulated cannabis operations."
        actions={[
          { label: 'Submit your company', href: '/intake' },
          { label: 'Request an introduction', href: '/contact', variant: 'secondary' },
        ]}
      >
        <p>
          Supplier and service-provider profiles for licensed cannabis and adjacent supply-chain
          participants. Public profiles are controlled summaries only. Introductions are routed
          through Harbourview review rather than direct public contact.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Supplier profiles do not imply verified availability, licensing, exclusivity, pricing
          or transaction readiness. Harbourview reviews introduction requests before routing.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader
          eyebrow="Categories"
          title="Supply-chain coverage for regulated operators."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <PublicCard key={cat.title} className="p-6">
              <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
              <h3 className="mb-3 text-base font-semibold text-[#f4f1eb]">{cat.title}</h3>
              <p className="text-sm leading-7 text-white/58">{cat.body}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-6 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-40" />
          <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No profiles listed yet</p>
          <p className="mb-8 max-w-xl text-sm leading-7 text-white/54">
            Harbourview supplier profiles are added through a controlled review process.
            Submit your company via intake or request an introduction for a supplier
            category you need.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="btn-marketplace text-sm">
              Submit your company
            </Link>
            <Link href="/contact" className="btn-intelligence text-sm">
              Request an introduction
            </Link>
          </div>
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Want to be listed?"
        title="Submit your company for Harbourview review."
        actions={[
          { label: 'Submit via intake', href: '/intake' },
          { label: 'Contact Harbourview', href: '/contact', variant: 'secondary' },
        ]}
      >
        Supplier inclusion requires Harbourview review of category fit, credentials and
        commercial relevance. Submission does not guarantee listing or introduction routing.
      </FooterCta>
    </>
  )
}
