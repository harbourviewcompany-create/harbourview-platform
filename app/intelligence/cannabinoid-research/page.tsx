import type { Metadata } from 'next'
import Link from 'next/link'
import IntelligenceModulePage from '@/app/intelligence/IntelligenceModulePage'
import { PublicSection, SectionHeader, PublicLinkCard } from '@/components/PublicUi'
import { getAllCannabinoidCompounds, approvalLabel } from '@/lib/intelligence/cannabinoidCompounds'

export const metadata: Metadata = {
  title: 'Cannabinoid Research | Harbourview Intelligence',
  description:
    'Cannabinoid compound reference data — approval status, clinical phase and molecular identity — sourced from ChEMBL, cross-referenced against jurisdiction licensing and scheduling context.',
}

// ISR: reference intelligence surface, same cadence as licensing-pathways/playbooks
export const revalidate = 3600

export default async function CannabinoidResearchPage() {
  const compounds = await getAllCannabinoidCompounds()

  return (
    <>
      <IntelligenceModulePage
        content={{
          eyebrow: 'Intelligence / Research',
          title: 'Cannabinoid compound reference: approval status and clinical evidence.',
          description:
            'Harbourview cross-references cannabinoid compound data from ChEMBL against jurisdiction licensing and scheduling context — which compounds carry a real drug approval, which remain investigational, and why that distinction routinely drives how a jurisdiction schedules raw plant material versus a processed extract.',
          requestLabel: 'Request Compound-Specific Research Brief',
          reviewItems: [
            'Approval status: which cannabinoids hold a genuine regulatory drug approval (FDA/EMA) versus which remain Phase 1–3 investigational compounds with no approval on record.',
            'Molecular identity: ChEMBL ID, molecular formula and known synonyms/brand names, so a compound named differently across jurisdictions or lab reports can be matched with confidence.',
            'Natural-product vs. synthesized distinction: whether a compound is derived from the plant or a laboratory synthesis — a distinction several jurisdictions\' scheduling frameworks draw on directly.',
            'Cross-links to licensing context: where a compound\'s approval status bears on a jurisdiction\'s cultivation, processing or import licensing pathway, this module links to the relevant Licensing Pathways or Playbook entry.',
          ],
          boundaryItems: [
            'Compound reference data is not medical, clinical or legal advice, and does not confirm a product\'s regulatory status in any specific jurisdiction.',
            'Approval status reflects ChEMBL\'s public record as of the last sync; operators should confirm current status with the relevant regulator before relying on it commercially.',
            'Harbourview does not provide legal advice. Jurisdiction-specific scheduling questions are routed through private intake, not this public surface.',
          ],
        }}
      />

      {compounds.length > 0 && (
        <PublicSection tone="panel">
          <SectionHeader
            eyebrow={`Live compound data — ${compounds.length} tracked`}
            title="Browse cannabinoid compounds"
            action={
              <Link
                href="/intelligence/licensing-pathways"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/72 hover:text-gold"
              >
                Licensing pathways →
              </Link>
            }
          >
            Sourced from ChEMBL and reviewed for regulatory relevance — not a generic compound database, a
            registry scoped to what actually moves a jurisdiction&apos;s scheduling or licensing decision.
          </SectionHeader>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {compounds.map((compound) => (
              <PublicLinkCard
                key={compound.chembl_id}
                href={`/intelligence/cannabinoid-research/${compound.chembl_id.toLowerCase()}`}
                eyebrow={approvalLabel(compound)}
                title={compound.pref_name}
              >
                {compound.molecular_formula && `${compound.molecular_formula} · `}
                {compound.is_natural_product ? 'Natural product' : 'Synthesized'}
              </PublicLinkCard>
            ))}
          </div>
        </PublicSection>
      )}
    </>
  )
}
