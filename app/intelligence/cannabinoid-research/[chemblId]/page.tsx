import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicSection, SectionHeader, PublicCard } from '@/components/PublicUi'
import {
  getAllCannabinoidCompounds,
  getCannabinoidCompound,
  approvalLabel,
} from '@/lib/intelligence/cannabinoidCompounds'

export const revalidate = 3600

export async function generateStaticParams() {
  const compounds = await getAllCannabinoidCompounds()
  return compounds.map((c) => ({ chemblId: c.chembl_id.toLowerCase() }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chemblId: string }>
}): Promise<Metadata> {
  const { chemblId } = await params
  const compound = await getCannabinoidCompound(chemblId)
  if (!compound) return { title: 'Compound Not Found | Harbourview Intelligence' }
  return {
    title: `${compound.pref_name} | Cannabinoid Research | Harbourview Intelligence`,
    description: compound.regulatory_notes ?? `${compound.pref_name} (${compound.chembl_id}) compound reference.`,
  }
}

export default async function CannabinoidCompoundPage({
  params,
}: {
  params: Promise<{ chemblId: string }>
}) {
  const { chemblId } = await params
  const compound = await getCannabinoidCompound(chemblId)
  if (!compound) return notFound()

  return (
    <>
      <div className="bg-[#020814] px-4 pt-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/intelligence/cannabinoid-research"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6a55a]/70 hover:text-[#c6a55a]"
          >
            ← Cannabinoid Research
          </Link>
        </div>
      </div>

      <PublicSection tone="navy">
        <SectionHeader eyebrow={compound.chembl_id} title={compound.pref_name}>
          {compound.regulatory_notes}
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <PublicCard>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">Regulatory status</h3>
            <p className="mt-2 text-lg text-white">{approvalLabel(compound)}</p>
          </PublicCard>
          <PublicCard>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">Molecular identity</h3>
            <p className="mt-2 text-lg text-white">{compound.molecular_formula ?? '—'}</p>
            {compound.synonyms && compound.synonyms.length > 0 && (
              <p className="mt-1 text-sm text-white/54">Also known as: {compound.synonyms.join(', ')}</p>
            )}
          </PublicCard>
          <PublicCard>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">Origin</h3>
            <p className="mt-2 text-lg text-white">
              {compound.is_natural_product ? 'Natural plant product' : 'Synthesized compound'}
            </p>
          </PublicCard>
          {compound.atc_codes && compound.atc_codes.length > 0 && (
            <PublicCard>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">ATC code(s)</h3>
              <p className="mt-2 text-lg text-white">{compound.atc_codes.join(', ')}</p>
            </PublicCard>
          )}
        </div>
      </PublicSection>

      <PublicSection tone="panel">
        <SectionHeader eyebrow="Cross-referenced context" title="How this affects market access">
          Approval status is a direct input to Harbourview&apos;s licensing pathway and regulatory signal
          coverage — not a standalone data point.
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href="/intelligence/licensing-pathways"
            className="block rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-gold/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/72">Licensing Pathways →</p>
            <p className="mt-2 text-sm text-white/72">
              See how cultivation, processing and import licences reference compound-level approval status by
              jurisdiction.
            </p>
          </Link>
          <Link
            href="/signals"
            className="block rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-gold/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/72">Related Signals →</p>
            <p className="mt-2 text-sm text-white/72">
              Track regulatory and market signals that reference this compound as jurisdictions update
              scheduling and licensing rules.
            </p>
          </Link>
        </div>
      </PublicSection>
    </>
  )
}
