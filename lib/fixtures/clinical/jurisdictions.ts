/**
 * Harbourview Clinical — Jurisdiction briefings + professional pathways
 * Source-verified high-level summaries. Always push verification against primary authority.
 * Expand carefully; never invent authority names or rules.
 */

import type {
  JurisdictionBriefing,
  ProfessionalPathway,
  WhatChangedEvent,
  ClinicalAttentionItem,
  ClinicalNextAction,
} from "@/lib/clinical/types";

export const JURISDICTION_BRIEFINGS: Record<string, JurisdictionBriefing> = {
  BR: {
    country: "Brazil",
    iso2: "BR",
    flag: "🇧🇷",
    status: "loaded",
    legalPathway: "Medical Legal (CBD and THC Products); No Adult-Use",
    adultUse: false,
    summary:
      "Medical cannabis is regulated by ANVISA. Patients access authorised cannabis-derived products via physician prescription. Adult-use remains prohibited. Domestic cultivation frameworks have expanded under recent ANVISA resolutions; import authorisation pathways also exist.",
    primaryAuthority: {
      name: "ANVISA (Agência Nacional de Vigilância Sanitária)",
      role: "Product authorisation, quality, import rules",
      url: "https://www.gov.br/anvisa",
    },
    professionalRegulator: {
      name: "Conselho Federal de Medicina (CFM)",
      role: "Professional standards for physicians",
    },
    keyRules: [
      "Only authorised cannabis products may be prescribed and dispensed",
      "Prescriptions must specify approved products",
      "Import authorisation remains an important access route for some patients",
      "Reimbursement discussions are ongoing; out-of-pocket cost is a barrier for many",
    ],
    accessNotes:
      "Patients access cannabis through physician prescription of authorised products. Cost remains a barrier for lower-income patients, though government reimbursement discussions are ongoing.",
    lastReviewed: "2026-07-20",
  },

  GB: {
    country: "United Kingdom",
    iso2: "GB",
    flag: "🇬🇧",
    status: "loaded",
    legalPathway: "Specialist prescription of CBPMs; no adult-use",
    adultUse: false,
    summary:
      "Cannabis-based products for medicinal use (CBPMs) may be prescribed by specialists on the GMC specialist register (or under defined pathways). Unlicensed CBPMs are the dominant route. NICE and MHRA frameworks apply. Adult-use is not legal.",
    primaryAuthority: {
      name: "MHRA / Home Office (scheduling) + specialist prescribing framework",
      role: "Product and prescribing framework",
    },
    professionalRegulator: {
      name: "General Medical Council (GMC)",
      role: "Professional regulation of doctors",
    },
    keyRules: [
      "Specialist initiation is the default for unlicensed CBPMs",
      "Shared-care arrangements exist in some settings but remain limited",
      "Product quality and traceability expectations are high",
    ],
    accessNotes:
      "Access is primarily private; NHS prescribing of CBPMs remains rare outside specific commissioned pathways.",
    lastReviewed: "2026-06-30",
  },

  DE: {
    country: "Germany",
    iso2: "DE",
    flag: "🇩🇪",
    status: "loaded",
    legalPathway: "Medical cannabis under BtMG / AMG frameworks; adult-use regulated separately",
    adultUse: true, // limited adult-use framework exists post-2024 reforms; medical pathway remains distinct
    summary:
      "Medical cannabis is established under narcotics and medicines law. Physicians may prescribe; reimbursement via statutory health insurance is possible under defined conditions. Adult-use reforms created a parallel non-medical pathway that must not be conflated with medical prescribing.",
    primaryAuthority: {
      name: "BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)",
      role: "Medicines and medical cannabis oversight",
    },
    professionalRegulator: {
      name: "State medical chambers / Bundesärztekammer framework",
      role: "Professional standards",
    },
    keyRules: [
      "Medical pathway is distinct from adult-use clubs / possession rules",
      "Reimbursement requires justification against alternative therapies in many cases",
      "Quality and GMP expectations apply to prescribed products",
    ],
    accessNotes:
      "Both pharmacy-dispensed medical cannabis and (separately regulated) adult-use routes exist; clinical practice must stay within the medical framework.",
    lastReviewed: "2026-07-10",
  },

  AU: {
    country: "Australia",
    iso2: "AU",
    flag: "🇦🇺",
    status: "loaded",
    legalPathway: "SAS-B / Authorised Prescriber pathways; no national adult-use",
    adultUse: false,
    summary:
      "Medicinal cannabis is accessed primarily via the Special Access Scheme (Category B) or Authorised Prescriber scheme under the TGA. State/territory rules also apply. Adult-use is not legal at federal level.",
    primaryAuthority: {
      name: "Therapeutic Goods Administration (TGA)",
      role: "SAS / AP pathways and product oversight",
    },
    professionalRegulator: {
      name: "Medical Board of Australia / AHPRA",
      role: "Professional registration and standards",
    },
    keyRules: [
      "Most prescribing occurs under SAS-B or Authorised Prescriber arrangements",
      "Product choice is large; quality and scheduling vary",
      "State/territory controlled-substance rules remain relevant",
    ],
    accessNotes:
      "Access is predominantly private; public pathways are limited. Documentation and TGA reporting obligations apply.",
    lastReviewed: "2026-07-05",
  },

  CA: {
    country: "Canada",
    iso2: "CA",
    flag: "🇨🇦",
    status: "loaded",
    legalPathway: "Medical access under Cannabis Act + provincial rules; adult-use legal nationally",
    adultUse: true,
    summary:
      "Medical cannabis operates under the federal Cannabis Act with provincial/territorial overlays. Patients may obtain medical authorisations from healthcare practitioners. Adult-use is legal and regulated separately; clinical practice should keep medical authorisation documentation distinct.",
    primaryAuthority: {
      name: "Health Canada",
      role: "Federal cannabis framework",
    },
    professionalRegulator: {
      name: "Provincial/territorial medical regulators",
      role: "Professional standards for physicians and NPs",
    },
    keyRules: [
      "Medical authorisation remains available alongside adult-use retail",
      "Provincial rules affect prescribing, dispensing and possession limits",
      "Product standards (including medical licence holders) differ from pure adult-use channels",
    ],
    accessNotes:
      "Many patients use adult-use retail for convenience; formal medical authorisation still matters for certain coverage, workplace, and clinical-documentation contexts.",
    lastReviewed: "2026-06-25",
  },

  CO: {
    country: "Colombia",
    iso2: "CO",
    flag: "🇨🇴",
    status: "loaded",
    legalPathway: "Medical cannabis regulated; limited adult-use reforms under discussion / partial",
    adultUse: false,
    summary:
      "Colombia has a regulated medical cannabis framework covering cultivation, manufacture and patient access. Physicians may prescribe within the national system. Adult-use remains restricted relative to medical channels.",
    primaryAuthority: {
      name: "INVIMA / Ministry of Health frameworks",
      role: "Product and health regulation",
    },
    professionalRegulator: {
      name: "Colombian medical regulatory bodies",
      role: "Professional practice standards",
    },
    keyRules: [
      "Medical access is the primary legal patient pathway",
      "Licensed production and manufacturing capacity is significant by regional standards",
      "Export orientation of the industry coexists with domestic medical access rules",
    ],
    accessNotes:
      "Domestic patient access exists but can be affected by product availability, pricing and distribution reach.",
    lastReviewed: "2026-07-01",
  },
};

export const PROFESSIONAL_PATHWAYS: Record<string, ProfessionalPathway> = {
  BR: {
    country: "Brazil",
    iso2: "BR",
    roles: "All roles",
    whoMayPrescribe:
      "Physicians registered with the Conselho Federal de Medicina may prescribe authorised cannabis products.",
    conditionsMentioned: [
      "epilepsy",
      "chronic pain",
      "Parkinson's disease",
      "anxiety",
      "other conditions as clinically justified",
    ],
    restrictions: [
      "Prescriptions must specify approved products",
      "No specialist-only restriction applies, though complexity of conditions may direct patients to specialists",
    ],
    notes:
      "Professional scope is determined by CFM registration and applicable clinical standards. Always confirm current CFM and ANVISA positions before relying on any summary.",
    lastReviewed: "2026-07-20",
  },
  GB: {
    country: "United Kingdom",
    iso2: "GB",
    roles: "Specialist-led",
    whoMayPrescribe:
      "Specialists on the GMC specialist register may initiate unlicensed CBPMs. Shared-care with generalists exists in limited settings.",
    conditionsMentioned: [
      "chronic pain",
      "spasticity",
      "epilepsy",
      "chemotherapy-induced nausea",
      "other specialist-justified indications",
    ],
    restrictions: [
      "Unlicensed CBPMs are the dominant route; specialist initiation is expected",
      "NHS prescribing remains uncommon outside specific pathways",
    ],
    notes:
      "Verify current GMC and specialist-society guidance. Product choice should be guided by clinical need and quality standards.",
    lastReviewed: "2026-06-30",
  },
  DE: {
    country: "Germany",
    iso2: "DE",
    roles: "Physicians",
    whoMayPrescribe:
      "Licensed physicians may prescribe medical cannabis within the applicable narcotics and medicines framework.",
    conditionsMentioned: [
      "chronic pain",
      "spasticity",
      "nausea",
      "other indications with clinical justification",
    ],
    restrictions: [
      "Reimbursement often requires documentation that alternative therapies are unsuitable or exhausted",
      "Adult-use rules must not be mixed into medical prescribing documentation",
    ],
    notes:
      "Keep medical prescribing clearly within the medical/BtMG pathway. Confirm current BfArM and chamber guidance.",
    lastReviewed: "2026-07-10",
  },
  AU: {
    country: "Australia",
    iso2: "AU",
    roles: "Authorised prescribers / SAS pathway",
    whoMayPrescribe:
      "Medical practitioners may prescribe under SAS-B or Authorised Prescriber arrangements; some nurse practitioners participate under defined rules.",
    conditionsMentioned: [
      "chronic pain",
      "anxiety",
      "epilepsy",
      "palliative care",
      "other TGA-accepted indications",
    ],
    restrictions: [
      "TGA pathway documentation and reporting obligations apply",
      "State/territory controlled-drug rules remain relevant",
    ],
    notes:
      "Product selection is broad; quality and scheduling differ. Confirm current TGA and state requirements.",
    lastReviewed: "2026-07-05",
  },
  CA: {
    country: "Canada",
    iso2: "CA",
    roles: "Healthcare practitioners (provincial variation)",
    whoMayPrescribe:
      "Physicians and, in many provinces, nurse practitioners may provide medical authorisations under the Cannabis Act framework.",
    conditionsMentioned: [
      "chronic pain",
      "nausea",
      "spasticity",
      "other clinically justified indications",
    ],
    restrictions: [
      "Provincial/territorial rules affect scope and documentation",
      "Adult-use retail is separate from medical authorisation",
    ],
    notes:
      "Medical authorisation documentation should remain distinct from adult-use purchases. Confirm provincial regulator guidance.",
    lastReviewed: "2026-06-25",
  },
  CO: {
    country: "Colombia",
    iso2: "CO",
    roles: "Physicians",
    whoMayPrescribe:
      "Licensed physicians may prescribe within the national medical cannabis framework.",
    conditionsMentioned: [
      "chronic pain",
      "epilepsy",
      "other indications recognised under national rules",
    ],
    restrictions: [
      "Prescribing must stay within authorised product and distribution channels",
    ],
    notes:
      "Confirm current Ministry of Health / INVIMA positions and professional-body guidance.",
    lastReviewed: "2026-07-01",
  },
};

/** Example “what changed” events (empty by default for most contexts) */
export const WHAT_CHANGED: WhatChangedEvent[] = [
  // Intentionally sparse — only publish when a reviewed material change exists
];

export function getAttentionItems(iso2: string): ClinicalAttentionItem[] {
  return [
    {
      id: "att-verify",
      title: "Verify against source",
      body: "Jurisdiction briefing is present; confirm material decisions against the cited authority and professional regulator.",
      severity: "attention",
    },
    {
      id: "att-applicability",
      title: "Inspect applicability",
      body: "Confirm population, formulation, jurisdiction, professional scope and source date before relying on a record.",
      severity: "attention",
    },
  ];
}

export function getNextActions(iso2: string): ClinicalNextAction[] {
  const briefing = JURISDICTION_BRIEFINGS[iso2];
  if (!briefing) {
    return [
      {
        id: "na-general",
        title: "Request jurisdiction briefing",
        body: "No detailed briefing is loaded for this country yet.",
        primaryActionLabel: "Request briefing",
      },
    ];
  }

  if (iso2 === "BR") {
    return [
      {
        id: "na-anvisa",
        title: "Cannabis products authorization",
        body: "ANVISA regulates cannabis-derived products and import authorization.",
        primaryActionLabel: "Open primary source ↗",
        primaryActionUrl: briefing.primaryAuthority.url,
      },
    ];
  }

  return [
    {
      id: "na-authority",
      title: "Primary framework authority",
      body: `Use current ${briefing.country} primary authorities rather than secondary summaries.`,
      primaryActionLabel: "Open primary source ↗",
      primaryActionUrl: briefing.primaryAuthority.url,
    },
  ];
}
