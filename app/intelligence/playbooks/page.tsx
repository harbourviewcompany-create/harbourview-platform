import type { Metadata } from 'next'
import { PublicHero, PublicSection, SectionHeader, PublicLinkCard, EmptyState } from '@/components/PublicUi'
import { getAllPlaybooks, DIFFICULTY_LABEL } from '@/lib/intelligence/jurisdictionPlaybooks'

export const metadata: Metadata = {
  title: 'Jurisdiction Playbooks | Harbourview Intelligence',
  description:
    'Reviewed, country-specific cannabis licensing pathways: licence sequence, named regulators, typical timelines and cost range for each tracked jurisdiction.',
}

// ISR: reference intelligence surface
export const revalidate = 3600

export default async function PlaybooksIndexPage() {
  const playbooks = await getAllPlaybooks()

  return (
    <>
      <PublicHero
        eyebrow="Intelligence / Playbooks"
        title="Jurisdiction playbooks: licensing pathways by country."
        actions={[
          { label: 'Licensing pathway categories', href: '/intelligence/licensing-pathways', variant: 'secondary' },
        ]}
      >
        Unlike a static market report, each playbook below is backed by Harbourview&apos;s reviewed source
        registry and updated as laws change — not a point-in-time snapshot.
      </PublicHero>

      <PublicSection tone="panel">
        <SectionHeader
          eyebrow={`${playbooks.length} jurisdiction${playbooks.length === 1 ? '' : 's'} tracked`}
          title="Browse by country"
        >
          Each playbook maps the licence sequence, named regulators, typical timeline and cost range for that
          jurisdiction specifically — not a generic category description.
        </SectionHeader>

        {playbooks.length === 0 ? (
          <EmptyState title="No playbooks published yet">
            Jurisdiction playbooks are reviewed and published on a rolling basis.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {playbooks.map((pb) => (
              <PublicLinkCard
                key={pb.country_iso2}
                href={`/intelligence/playbooks/${pb.country_iso2.toLowerCase()}`}
                eyebrow={`${pb.country_iso2} · ${DIFFICULTY_LABEL[pb.difficulty]}`}
                title={pb.country_name}
              >
                {pb.typical_timeline_months != null && `${pb.typical_timeline_months} month typical timeline · `}
                {pb.steps.length} licensing step{pb.steps.length === 1 ? '' : 's'} ·{' '}
                {pb.key_regulators.length} regulator{pb.key_regulators.length === 1 ? '' : 's'} mapped
              </PublicLinkCard>
            ))}
          </div>
        )}
      </PublicSection>
    </>
  )
}
