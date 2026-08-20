import type { Metadata } from 'next'
import { PublicHero, PublicSection, SectionHeader, PublicCard } from '@/components/PublicUi'
import { getApprovedProviders, groupByCategory } from '@/lib/marketplace/professionalServices'
import { ProfessionalServiceApplicationForm } from '@/components/marketplace/ProfessionalServiceApplicationForm'

// ISR: marketplace listing data
export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Professional Services Directory | Harbourview Intelligence',
  description:
    'Cannabis-specialized legal, accounting, banking, insurance, and compliance providers, vetted before listing.',
}

export default async function ProfessionalServicesPage() {
  const providers = await getApprovedProviders()
  const groups = groupByCategory(providers)

  return (
    <>
      <PublicHero
        eyebrow="Marketplace / Professional Services"
        title="Cannabis-specialized professional services"
        actions={[{ label: 'Back to Marketplace', href: '/marketplace', variant: 'secondary' }]}
      >
        Legal counsel, accounting, banking, insurance, and compliance consulting providers with real
        cannabis industry experience — reviewed before they appear here.
      </PublicHero>

      {groups.length === 0 ? (
        <PublicSection tone="panel">
          <SectionHeader eyebrow="Directory" title="No listed providers yet">
            This directory launches empty rather than with placeholder entries. Every listing below
            is a real, reviewed provider — none have been added yet. If you know a firm that should
            be here, or run one, use the application below.
          </SectionHeader>
        </PublicSection>
      ) : (
        groups.map((group) => (
          <PublicSection key={group.category} tone="panel">
            <SectionHeader eyebrow={group.label} title={group.label}>
              {group.providers.length} provider{group.providers.length === 1 ? '' : 's'} listed.
            </SectionHeader>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {group.providers.map((p) => (
                <PublicCard key={p.id} className="p-6">
                  <h3 className="text-base font-semibold text-[#f5f1e8]">{p.name}</h3>
                  {p.description && <p className="mt-2 text-sm leading-6 text-white/58">{p.description}</p>}
                  {p.markets_covered.length > 0 && (
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/70">
                      {p.markets_covered.join(' · ')}
                    </p>
                  )}
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/72 hover:text-gold"
                    >
                      Visit site →
                    </a>
                  )}
                </PublicCard>
              ))}
            </div>
          </PublicSection>
        ))
      )}

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Get listed" title="Apply to be listed">
          Submissions are reviewed before publishing. You&apos;ll need to be signed in to apply.
        </SectionHeader>
        <ProfessionalServiceApplicationForm />
      </PublicSection>
    </>
  )
}
