import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Signals',
  description:
    'Global policy and regulatory change monitoring for regulated cannabis, hemp/CBD, and adjacent controlled-market pathways.',
}

const signalSections = [
  {
    title: 'Regulatory Changes',
    description:
      'Source-backed updates from regulators, agencies, and statutory authorities affecting regulated cannabis and adjacent controlled-market pathways.',
  },
  {
    title: 'Policy Announcements',
    description:
      'Government and agency policy announcements that may alter compliance requirements, market structure, access conditions, or commercial timing.',
  },
  {
    title: 'Import and Export Pathways',
    description:
      'Changes to cross-border rules, controlled-substance permissions, customs pathways, and authorization frameworks for compliant movement of products.',
  },
  {
    title: 'Licensing and Market Access',
    description:
      'Updates to licensing regimes, application windows, eligibility rules, operating permissions, and country-level market entry conditions.',
  },
  {
    title: 'Prescription and Patient Access',
    description:
      'Changes to medical cannabis prescribing rules, patient access pathways, dispensing criteria, and recognized treatment channels.',
  },
  {
    title: 'Hemp, CBD and Controlled Cannabinoids',
    description:
      'Policy and regulatory movement affecting hemp, CBD, novel cannabinoids, controlled cannabinoid scheduling, and related product classifications.',
  },
  {
    title: 'Enforcement and Compliance Actions',
    description:
      'Notable enforcement actions, compliance notices, agency decisions, and judicial outcomes relevant to regulated operators and market participants.',
  },
  {
    title: 'Consultations and Pending Rule Changes',
    description:
      'Open consultations, proposed rules, legislative movement, and pending decisions that may signal future changes in regulated-market pathways.',
  },
]

export default function SignalsPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="inline-block text-xs font-semibold uppercase tracking-widest bg-gold text-navy px-2 py-1 rounded mb-4">
            Coming Soon
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Signals</h1>
          <p className="text-gray-300 max-w-2xl">
            Global policy and regulatory change monitoring for regulated
            cannabis, hemp/CBD and adjacent controlled-market pathways.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="page-container max-w-2xl">
          <p className="text-gray-500 text-sm mb-10">
            Harbourview Signals tracks official notices, regulator updates,
            legislative movement, enforcement actions and country-level policy
            shifts that may affect market access, compliance strategy and
            commercial timing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            {signalSections.map((section) => (
              <div key={section.title} className="border-t-2 border-gold pt-5">
                <h3 className="font-semibold text-navy text-base mb-2">
                  {section.title}
                </h3>
                <p className="text-gray-500 text-sm">{section.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-navy font-bold text-xl mb-3">
              Source-Backed Monitoring
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Signals is being built for dated, source-backed regulatory
              monitoring. It is not live investment advice, real-time buyer
              demand, supplier intelligence, deal flow, or private Harbourview
              Network activity.
            </p>
            <Link href="/intake" className="btn-primary px-8 py-3">
              Request Early Access
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
