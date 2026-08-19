/**
 * EU / destination GMP recognition orientation for corridor plans.
 * Based on public EMA / Commission MRA frameworks — not site-specific certificates.
 * Product scope of every MRA must be confirmed; cannabis SKUs are not automatically covered.
 */

export type GmpFrameworkKind =
  | 'eea_internal'
  | 'mra'
  | 'acaa'
  | 'ceta_protocol'
  | 'tca_uk'
  | 'no_mra'
  | 'destination_not_eea'
  | 'unknown'

export type GmpRecognitionProfile = {
  framework: GmpFrameworkKind
  label: string
  /** High-level posture for this origin→destination pair */
  summary: string
  /** Typical quality path operators plan against */
  typicalPaths: string[]
  /** Instruments / partners (orientation labels) */
  instruments: string[]
  /** What this does NOT automatically solve */
  doesNotCover: string[]
  /** Diligence checklist */
  verifyBeforeRelying: string[]
  eudraGmdpHint: string
  disclaimer: string
}

const EEA = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'IS', 'LI', 'NO',
])

/** Third countries with an operational EU pharma GMP MRA / ACAA / CETA protocol (orientation). */
const EU_MRA_PARTNERS: Record<
  string,
  { kind: GmpFrameworkKind; instruments: string[]; note: string }
> = {
  AU: {
    kind: 'mra',
    instruments: ['EU–Australia MRA (medicinal products GMP)'],
    note: 'Operational MRA; product scope still must be confirmed per SKU.',
  },
  CA: {
    kind: 'ceta_protocol',
    instruments: [
      'CETA Protocol on mutual recognition of GMP compliance programmes for pharmaceutical products',
      'Former bilateral MRA suspended into CETA (provisional application)',
    ],
    note: 'CETA helps in-scope pharmaceuticals between operational authorities — not a blanket cannabis waiver.',
  },
  IL: {
    kind: 'acaa',
    instruments: ['EU–Israel ACAA (conformity assessment; GMP-aligned)'],
    note: 'ACAA implies stronger legislative alignment than a thin MRA; exclusions still apply.',
  },
  JP: {
    kind: 'mra',
    instruments: ['EU–Japan MRA (GMP sectoral annex)'],
    note: 'Scope expanded over time; confirm sterile/biological coverage if relevant.',
  },
  NZ: {
    kind: 'mra',
    instruments: ['EU–New Zealand MRA'],
    note: 'Operational MRA for covered medicinal products.',
  },
  CH: {
    kind: 'mra',
    instruments: ['EU–Switzerland MRA (GMP)'],
    note: 'Strong mutual reliance for covered products; CH is outside EU customs/medicines single market.',
  },
  US: {
    kind: 'mra',
    instruments: ['EU–US MRA (pharmaceutical GMP inspections)'],
    note: 'Inspection reliance for in-scope human (and later veterinary) products; not a cannabis-specific instrument.',
  },
  GB: {
    kind: 'tca_uk',
    instruments: ['EU–UK Trade and Cooperation Agreement — Annex TBT-2 Medicinal Products'],
    note: 'Recognition of GMP inspection outcomes — not pre-Brexit single market; UK QP release ≠ automatic EU release.',
  },
}

const BASE_DOES_NOT_COVER = [
  'National narcotics import/export permits and transport authorisations',
  'Named importer wholesale / GDP / controlled-substance scope',
  'Automatic coverage of every cannabis SKU under an MRA product annex',
  'Site-specific certificate status (always verify current evidence)',
]

const BASE_VERIFY = [
  'Is the SKU classified as a medicinal product under destination law?',
  'Does a current GMP certificate exist for the manufacturing site (e.g. visible on EudraGMDP or partner equivalent)?',
  'Who issued the certificate (EEA NCA vs partner authority) and is it within validity expectations?',
  'Is the product inside the operational product scope of any MRA/ACAA/CETA protocol relied upon?',
  'Will the EU Qualified Person require import testing, or do MRA conditions allow reliance on export-country controls?',
  'Is GACP evidence required upstream of EU-GMP processing for flower / starting material?',
]

function buildForEeaInternal(origin: string, destination: string): GmpRecognitionProfile {
  return {
    framework: 'eea_internal',
    label: 'EEA internal GMP system',
    summary: `${origin} and ${destination} are both in the EEA. Manufacturing quality is governed by EU GMP (EudraLex Vol 4) and national manufacturing/import authorisations — not a third-country MRA path.`,
    typicalPaths: [
      'Site holds EEA manufacturing authorisation / EU-GMP certificate from a competent authority',
      'QP batch certification in the supply chain as required for the dosage form',
      'Narcotics and GDP formalities still apply to controlled cannabis movements between Member States',
    ],
    instruments: [
      'Directive 2001/83/EC (manufacture/import)',
      'Directive 2003/94/EC / EudraLex Volume 4 (EU GMP)',
      'EudraGMDP (certificate visibility)',
    ],
    doesNotCover: [
      ...BASE_DOES_NOT_COVER,
      '“Free movement of goods” does not remove narcotics transport permits inside the EU',
    ],
    verifyBeforeRelying: BASE_VERIFY,
    eudraGmdpHint:
      'Confirm the manufacturing site’s current EU-GMP / manufacturing authorisation status via EudraGMDP or the issuing NCA.',
    disclaimer:
      'Orientation only. Intra-EEA quality recognition does not replace national narcotics law or importer licensing.',
  }
}

function buildForPartnerToEea(
  origin: string,
  destination: string,
  partner: { kind: GmpFrameworkKind; instruments: string[]; note: string },
): GmpRecognitionProfile {
  const frameworkLabel =
    partner.kind === 'acaa'
      ? 'ACAA / aligned GMP framework'
      : partner.kind === 'ceta_protocol'
        ? 'CETA GMP protocol (+ possible EU-GMP site certificate)'
        : partner.kind === 'tca_uk'
          ? 'EU–UK TCA medicinal products annex'
          : 'EU mutual recognition agreement (GMP)'

  return {
    framework: partner.kind,
    label: frameworkLabel,
    summary: [
      `${origin} has a formal EU pharmaceutical GMP cooperation instrument (${frameworkLabel}).`,
      partner.note,
      `Destination ${destination} is in the EEA — import quality is still verified by the supervisory Member State / importer QP framework.`,
    ].join(' '),
    typicalPaths: [
      'Confirm whether the SKU falls inside operational MRA/ACAA/CETA product scope for the relevant authorities',
      'Prefer a current EU-GMP certificate issued or recognised for the manufacturing site (EudraGMDP)',
      'Direct path: EEA NCA inspects third-country site and issues GMP certificate',
      'Indirect path: GACP material processed/released via an EEA EU-GMP manufacturing site',
      'Importer QP certifies batches; import testing may still be required unless MRA conditions fully apply',
    ],
    instruments: partner.instruments,
    doesNotCover: BASE_DOES_NOT_COVER,
    verifyBeforeRelying: BASE_VERIFY,
    eudraGmdpHint:
      'Do not rely on “MRA with origin country” alone — verify site certificate issuer, date, and dosage-form scope on EudraGMDP or partner databases.',
    disclaimer:
      'Orientation-level framework map only. MRA product annexes and operational authority lists change; confirm with competent authorities before acting.',
  }
}

function buildForNoMraToEea(origin: string, destination: string): GmpRecognitionProfile {
  return {
    framework: 'no_mra',
    label: 'No EU GMP MRA — inspection or EU processing path',
    summary: `${origin} is not listed here as an operational EU pharmaceutical GMP MRA/ACAA partner. Supply into EEA destination ${destination} typically requires an EEA NCA GMP inspection of the third-country site and/or further processing and release at an EEA EU-GMP site.`,
    typicalPaths: [
      'EEA national competent authority inspects the overseas manufacturing site (EU-GMP certificate)',
      'GACP cultivation in origin → EU-GMP processing / testing / packaging in an EEA Member State → national distribution',
      'EU importer holds manufacturing/import authorisation; QP certifies batches for the Union market',
    ],
    instruments: [
      'EU GMP (EudraLex Vol 4) applied via NCA inspection',
      'Compilation of Union Procedures — verification of third-country manufacturer GMP status',
    ],
    doesNotCover: BASE_DOES_NOT_COVER,
    verifyBeforeRelying: BASE_VERIFY,
    eudraGmdpHint:
      'Plan certificate evidence early — without an MRA, recognition rests on EU/EEA inspection outcomes and importer QP responsibility.',
    disclaimer:
      'Orientation only. Absence from this partner list may reflect data gaps; always confirm current bilateral arrangements.',
  }
}

function buildDestinationNotEea(origin: string, destination: string): GmpRecognitionProfile {
  return {
    framework: 'destination_not_eea',
    label: 'Destination outside EEA — local GMP / import rules dominate',
    summary: `Destination ${destination} is outside the EEA. EU MRA frameworks do not by themselves authorise import there. Map origin ${origin} quality evidence to the destination competent authority’s GMP recognition and import testing rules.`,
    typicalPaths: [
      'Identify destination GMP standard (e.g. PIC/S, national GMP, TGA clearance)',
      'Check whether destination has its own MRA or reliance arrangement with the origin authority',
      'Confirm import testing, irradiation/treatment, and narcotics permits under destination law',
    ],
    instruments: ['Destination national medicines + narcotics law (primary)'],
    doesNotCover: [
      ...BASE_DOES_NOT_COVER,
      'Automatic reliance on EU-GMP certificates by non-EEA destinations',
    ],
    verifyBeforeRelying: [
      'What GMP evidence does the destination competent authority accept?',
      'Is EU-GMP certificate supportive only or sufficient?',
      ...BASE_VERIFY.slice(0, 3),
    ],
    eudraGmdpHint:
      'EU-GMP / EudraGMDP evidence may be supportive internationally but is not a universal passport outside the EEA.',
    disclaimer:
      'Orientation only. Non-EEA destinations apply their own recognition rules (e.g. Australia TGA, UK MHRA).',
  }
}

/**
 * Build orientation GMP recognition profile for a corridor pair.
 */
export function buildGmpRecognition(
  originIso2: string,
  destinationIso2: string,
): GmpRecognitionProfile {
  const origin = originIso2.toUpperCase()
  const destination = destinationIso2.toUpperCase()

  const destEea = EEA.has(destination)
  const originEea = EEA.has(origin)

  if (originEea && destEea) {
    return buildForEeaInternal(origin, destination)
  }

  if (!destEea) {
    // Special case: destination GB still benefits from TCA note when origin is EEA
    if (destination === 'GB' && originEea) {
      const partner = EU_MRA_PARTNERS.GB
      return {
        ...buildForPartnerToEea(origin, destination, partner),
        summary: `Origin ${origin} is in the EEA; destination is Great Britain. EU–UK TCA Annex TBT-2 supports recognition of GMP inspection outcomes, but the UK is not in the EU single market for medicines. Separate MHRA / Home Office controlled-drug pathways apply.`,
        framework: 'tca_uk',
        label: 'EU–UK TCA (destination GB)',
      }
    }
    return buildDestinationNotEea(origin, destination)
  }

  // Destination is EEA; origin third country
  const partner = EU_MRA_PARTNERS[origin]
  if (partner) {
    return buildForPartnerToEea(origin, destination, partner)
  }

  return buildForNoMraToEea(origin, destination)
}
