import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Request Genetics Access | Harbourview Exchange',
  description: 'Request reviewed access to genetics programs through Harbourview.',
}

export default function GeneticsRequestAccessPage() {
  return (
    <>
      <PublicHero
        eyebrow="Genetics — Request Access"
        title="Request reviewed access to a genetics program."
        actions={[
          { label: 'Confidential Intake', href: '/intake' },
          { label: 'Genetics overview', href: '/marketplace/genetics', variant: 'secondary' },
        ]}
      >
        <p>
          Describe the program, markets and authority context. Harbourview reviews before any introduction.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Use confidential intake for full commercial context. Access is never automatic.
        </PublicCard>
      </PublicSection>
    </>
  )
}
