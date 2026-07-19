import type { Metadata } from 'next'
import Link from 'next/link'
import IntelligenceModulePage from '@/app/intelligence/IntelligenceModulePage'
import { PublicSection, SectionHeader, PublicLinkCard } from '@/components/PublicUi'
import { getAllPlaybooks, DIFFICULTY_LABEL } from '@/lib/intelligence/jurisdictionPlaybooks'

export const metadata: Metadata = {
  title: 'Licensing Pathways | Harbourview Intelligence',
  description: 'Regulatory licensing pathway context for import, export, cultivation, processing and distribution across priority jurisdictions.',
}

export const dynamic = 'force-dynamic'

const COUNTRY_FLAGS: Record<string, string> = {
  DE: 'ð©ðª', GB: 'ð¬ð§', AU: 'ð¦ðº', CA: 'ð¨ð¦', NL: 'ð³ð±',
  PT: 'ðµð¹', TH: 'ð¹ð­', IL: 'ð®ð±', CO: 'ð¨ð´', ZA: 'ð¿ð¦',
  MT: 'ð²ð¹', LU: 'ð±ðº', CZ: 'ð¨ð¿', NZ: 'ð³ð¿', MX: 'ð²ð½',
  BR: 'ð§ð·', CH: 'ð¨ð­', FR: 'ð«ð·', ES: 'ðªð¸', PL: 'ðµð±',
  AE: '🇦🇪', AG: '🇦🇬', AR: '🇦🇷', AT: '🇦🇹', BA: '🇧🇦', BB: '🇧🇧', BE: '🇧🇪',
  CL: '🇨🇱', CR: '🇨🇷', DK: '🇩🇰', DM: '🇩🇲', DO: '🇩🇴', EC: '🇪🇨', EE: '🇪🇪',
  FI: '🇫🇮', GD: '🇬🇩', GH: '🇬🇭', GR: '🇬🇷', GY: '🇬🇾', HR: '🇭🇷', HU: '🇭🇺',
  IE: '🇮🇪', IS: '🇮🇸', JM: '🇯🇲', JP: '🇯🇵', KN: '🇰🇳', KR: '🇰🇷', LB: '🇱🇧',
  LC: '🇱🇨', LI: '🇱🇮', LT: '🇱🇹', LV: '🇱🇻', MK: '🇲🇰', MU: '🇲🇺', NO: '🇳🇴',
  PA: '🇵🇦', PE: '🇵🇪', PH: '🇵🇭', PR: '🇵🇷', RO: '🇷🇴', RS: '🇷🇸', SC: '🇸🇨',
  SE: '🇸🇪', SG: '🇸🇬', SI: '🇸🇮', SK: '🇸🇰', TR: '🇹🇷', TT: '🇹🇹', UA: '🇺🇦',
  US: '🇺🇸', UY: '🇺🇾', VC: '🇻🇨',
}

export default async function LicensingPathwaysPage() {
  const playbooks = await getAllPlaybooks()

  return (
    <>
      <IntelligenceModulePage
        content={{
          eyebrow: 'Intelligence / Licensing',
          title: 'Licensing pathway context for regulated cannabis market access.',
          description:
            'Harbourview licensing pathway intelligence orients operators around licence categories, authorisation requirements, pathway questions and jurisdiction-specific review needs â without providing legal advice, confirming eligibility or publishing private route analysis.',
          requestLabel: 'Request Licensing Pathway Intelligence',
          reviewItems: [
            'Cultivation licence categories: an orientation to cultivation authorisation types, GACP certificate requirements, output volume controls and export eligibility distinctions across priority source markets.',
            'Manufacturing and processing licences: GMP certification scope, secondary processing authorisation, product form permissions and the licence basis for export-ready batch production.',
            'Import authorisation frameworks: competent authority structures, narcotics import order processes, GDP requirements and importer qualification steps across tracked destination markets.',
            'Export licence and permit structures: export authorisation categories, narcotics export permit frameworks, phytosanitary requirements and Incoterm-relevant export responsibility.',
            'Wholesale and distribution authorisation: GDP-certified wholesale distribution licence categories, pharmacy supply permissions, controlled drug handling authorisations and re-export permissions.',
            'Special access and unlicensed pathways: compassionate use, named patient, special access scheme and temporary authorisation frameworks in jurisdictions where full market authorisation has not been granted.',
          ],
          boundaryItems: [
            'Pathway summaries are orientation-level only. They do not confirm licence eligibility, authorisation scope, route viability or legal sufficiency for any specific operator or transaction.',
            'Specific licensing questions involving products, batches, counterparties, contracts or active regulatory submissions are routed through private intake â not this public surface.',
            'Harbourview does not provide legal advice. Operators should verify licensing requirements with qualified local legal advisors and the relevant competent authority.',
          ],
        }}
      />

      {playbooks.length > 0 && (
        <PublicSection tone="panel">
          <SectionHeader
            eyebrow={`Live jurisdiction data â ${playbooks.length} markets`}
            title="Browse licence pathways by jurisdiction"
            action={
              <Link
                href="/intelligence/playbooks"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/72 hover:text-gold"
              >
                All playbooks â
              </Link>
            }
          >
            The licence categories above apply differently in every market. These are Harbourview&apos;s reviewed,
            jurisdiction-specific licence sequences â named regulators, step counts and typical timelines â not
            generic category descriptions.
          </SectionHeader>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {playbooks.map((pb) => (
              <PublicLinkCard
                key={pb.country_iso2}
                href={`/intelligence/playbooks/${pb.country_iso2.toLowerCase()}`}
                eyebrow={`${COUNTRY_FLAGS[pb.country_iso2] ?? 'ð'} ${pb.country_iso2} Â· ${DIFFICULTY_LABEL[pb.difficulty]}`}
                title={pb.country_name}
              >
                {pb.typical_timeline_months != null && `${pb.typical_timeline_months} month typical timeline Â· `}
                {pb.steps.length} licensing steps Â·{' '}
                {pb.key_regulators.length} regulator{pb.key_regulators.length === 1 ? '' : 's'} mapped
              </PublicLinkCard>
            ))}
          </div>
        </PublicSection>
      )}
    </>
  )
}
