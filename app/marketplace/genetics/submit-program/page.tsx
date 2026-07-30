import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Submit Genetics Program | Harbourview Exchange',
  description: 'Submit a genetics program for Harbourview review.',
}

export default function GeneticsSubmitProgramPage() {
  return (
    <>
      <PublicHero
        eyebrow="Genetics — Submit Program"
        title="Submit a genetics program for controlled review."
        actions={[
          { label: 'Submit via intake', href: '/marketplace/sell' },
          { label: 'Genetics overview', href: '/marketplace/genetics', variant: 'secondary' },
        ]}
      >
        <p>
          Program submissions remain private by default. Public visibility is never automatic.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Use marketplace intake or confidential intake for full program details.
        </PublicCard>
      </PublicSection>
    </>
  )
}
