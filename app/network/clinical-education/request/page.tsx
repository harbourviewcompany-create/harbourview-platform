import type { Metadata } from 'next'
import { ClinicalEducationDisclaimer } from '@/components/clinical-education/ClinicalEducationComponents'
import { FormShell, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Request Education Support | Harbourview Clinical Education',
  description: 'Submit a professional education request for product formats, country readiness, documentation or professional education support.',
}

const fields = [
  'Name', 'Email', 'Organization', 'Professional category',
  'Country', 'Topic of interest', 'Countries of interest', 'Formats of interest',
]

export default function ClinicalEducationRequestPage() {
  return (
    <>
      <PublicHero
        eyebrow="Clinical Education / Request"
        title="Request Education Support"
        compact
      >
        <p>
          Submit a professional education request related to product formats, country readiness,
          documentation or professional education support.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-3xl space-y-8">
          <FormShell>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-6">
              {fields.map((field) => (
                <div key={field} className="rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                  {field}
                </div>
              ))}
              <p className="col-span-full text-xs text-white/30 pt-2">
                Full intake form — coming soon. Use confidential intake in the meantime.
              </p>
            </div>
          </FormShell>
          <ClinicalEducationDisclaimer type="patient-boundary" />
        </div>
      </PublicSection>
    </>
  )
}
