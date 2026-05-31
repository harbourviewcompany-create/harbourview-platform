import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getExplainer } from '@/lib/compliance/explainers'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

type ExplainerPageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: ExplainerPageProps): Promise<Metadata> {
  const { slug } = await params
  const explainer = getExplainer(slug)
  if (!explainer) return { title: 'Explainer Not Found | Harbourview' }
  return {
    title: `${explainer.title} | Harbourview Compliance`,
    description: explainer.summary,
  }
}

function ListCard({ eyebrow, items }: { eyebrow: string; items: string[] }) {
  if (!items.length) return null
  return (
    <PublicCard className="p-6">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">{eyebrow}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-white/62">
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
            {item}
          </li>
        ))}
      </ul>
    </PublicCard>
  )
}

export default async function ExplainerPage({ params }: ExplainerPageProps) {
  const { slug } = await params
  const explainer = getExplainer(slug)
  if (!explainer) return notFound()

  return (
    <main>
      <PublicHero eyebrow="Compliance / Explainers" title={explainer.title} compact>
        <p className="text-sm leading-7 text-white/60">{explainer.summary}</p>
      </PublicHero>

      <PublicSection tone="dark">
        <div className="mb-6">
          <Link href="/compliance" className="text-xs font-semibold uppercase tracking-widest text-gold/60 hover:text-gold transition-colors">
            ← Compliance
          </Link>
        </div>

        {/* Who it applies to + commercial relevance */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PublicCard className="p-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">Who it applies to</p>
            <ul className="space-y-1.5">
              {explainer.whoItAppliesTo.map((who) => (
                <li key={who} className="flex gap-3 text-sm text-white/60">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                  {who}
                </li>
              ))}
            </ul>
          </PublicCard>
          <PublicCard className="p-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">Commercial relevance</p>
            <p className="text-sm leading-7 text-white/60">{explainer.commercialRelevance}</p>
          </PublicCard>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ListCard eyebrow="Core requirements" items={explainer.coreRequirements} />
          <ListCard eyebrow="Documents usually involved" items={explainer.documentsUsuallyInvolved} />
          <ListCard eyebrow="Operational controls" items={explainer.operationalControls} />
          <ListCard eyebrow="Common failure points" items={explainer.commonFailurePoints} />
        </div>

        {explainer.countryVariation && (
          <PublicCard muted className="mt-5 p-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">Country variation</p>
            <p className="text-sm leading-7 text-white/55">{explainer.countryVariation}</p>
          </PublicCard>
        )}
      </PublicSection>

      <PublicSection tone="navy">
        {explainer.harbourviewCanScreen.length > 0 && (
          <div className="mb-6">
            <SectionHeader eyebrow="Harbourview screening" title="What Harbourview can review." />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {explainer.harbourviewCanScreen.map((item) => (
                <PublicCard key={item} muted className="p-5">
                  <p className="text-sm text-white/58">{item}</p>
                </PublicCard>
              ))}
            </div>
          </div>
        )}

        {explainer.specialistAdviceRequired && (
          <PublicCard muted className="mb-5 p-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/60">Specialist advice required</p>
            <p className="text-sm leading-7 text-white/50">{explainer.specialistAdviceRequired}</p>
          </PublicCard>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/compliance/request-support"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-[#d6b76d]"
          >
            Request Compliance Support
          </a>
          <a
            href="/intake"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy"
          >
            Speak Confidentially
          </a>
        </div>

        <PublicCard muted className="mt-8 p-5 text-xs leading-6 text-white/40">
          {explainer.disclaimer}
        </PublicCard>
      </PublicSection>
    </main>
  )
}
