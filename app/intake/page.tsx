import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from '@/lib/contact'
import { PageHero, SectionFrame, SectionHeader, Surface, TrustBoundaryPanel } from '@/components/design-system/Institutional'
import ConfidentialIntakeForm from './ConfidentialIntakeForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Confidential Intake | Harbourview',
  description:
    'Submit a confidential Harbourview inquiry for market access, commercial intelligence, reviewed opportunities and qualified introductions.',
}

const reviewNotes = [
  'Use this route for sensitive commercial requirements, private counterparties, market-access questions or intelligence requests.',
  'Do not submit secrets, privileged legal material or raw documents unless Harbourview explicitly requests them through a controlled channel.',
  'Submission does not create a mandate, guarantee an introduction or authorize public publication.',
]

export default function IntakePage() {
  return (
    <>
      <PageHero
        eyebrow="Confidential review"
        title="A private starting point for sensitive regulated-market situations."
        primary={{ label: 'Begin Intake', href: '#confidential-intake' }}
        secondary={{ label: 'Email Harbourview', href: CONTACT_MAILTO_HREF }}
        aside={<TrustBoundaryPanel />}
        compact
      >
        <p>
          Share the minimum context needed for review. Harbourview separates private inquiry handling from public network and intelligence routes.
        </p>
      </PageHero>

      <SectionFrame tone="editorial" id="confidential-intake">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <ConfidentialIntakeForm />

          <aside className="space-y-5">
            <Surface tone="form" className="rounded-[1.75rem] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8f7130]">Direct contact</p>
              <h2 className="mt-3 font-serif text-2xl tracking-[-0.03em] text-[#061527]">Use direct email for sensitive routing questions.</h2>
              <p className="mt-3 text-sm leading-7 text-[#435066]">
                For confidential inquiries and qualified opportunities: <a href={CONTACT_MAILTO_HREF} className="font-semibold text-[#061527] underline decoration-[#a9873c]/45 underline-offset-4 hover:text-[#8f7130]">{CONTACT_EMAIL}</a>
              </p>
            </Surface>

            <Surface tone="form" className="rounded-[1.75rem] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8f7130]">Review boundary</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#435066]">
                {reviewNotes.map((note) => <li key={note}>• {note}</li>)}
              </ul>
            </Surface>
          </aside>
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Disclosure discipline" title="Confidential intake must not feel like a commodity contact form." className="mb-0">
          <p>
            The route is intentionally restrained: it asks for enough context to qualify the situation while avoiding public exposure, premature publication or uncontrolled evidence handling.
          </p>
        </SectionHeader>
      </SectionFrame>
    </>
  )
}
