import type { Metadata } from 'next'
import { requestSupportDisclaimer } from '@/lib/compliance/disclaimers'
import { FormShell, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Request Compliance Support | Harbourview',
  description: 'Submit a structured compliance support request for regulated cannabis market entry, routing and documentation review.',
}

export default function ComplianceRequestSupportPage() {
  return (
    <>
      <PublicHero eyebrow="Compliance" title="Request Compliance Support" compact>
        <p>Submit a structured request so Harbourview can assess your compliance requirements and determine whether specialist routing is appropriate.</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-xl space-y-6">
          <FormShell>
            <div className="p-6 space-y-3">
              {['Name', 'Company', 'Email', 'Target Countries', 'Support needed'].map((f) => (
                <div key={f} className="rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/44">{f}</div>
              ))}
              <p className="text-xs text-white/28 pt-1">Full intake form — coming soon. Use confidential intake in the meantime.</p>
            </div>
          </FormShell>
          <p className="text-xs leading-7 text-white/40">{requestSupportDisclaimer}</p>
        </div>
      </PublicSection>
    </>
  )
}
