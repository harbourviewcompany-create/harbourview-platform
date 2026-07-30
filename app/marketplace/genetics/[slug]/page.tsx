import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Genetics ${slug} | Harbourview Exchange`,
    description: 'Public genetics program summary on Harbourview Exchange.',
  }
}

export default async function GeneticsProgramPage({ params }: PageProps) {
  const { slug } = await params

  return (
    <>
      <PublicHero
        eyebrow="Genetics program"
        title={slug.replace(/[-_]+/g, ' ')}
        actions={[
          { label: 'Request access', href: '/marketplace/genetics/request-access' },
          { label: 'All genetics', href: '/marketplace/genetics', variant: 'secondary' },
        ]}
      >
        <p>
          Public orientation for this genetics program. Access and introductions require Harbourview review.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 space-y-4 text-sm leading-7 text-white/62">
          <p>Program reference: {slug}</p>
          <Link href="/marketplace/genetics" className="btn-marketplace inline-flex">
            Back to genetics
          </Link>
        </PublicCard>
      </PublicSection>
    </>
  )
}
