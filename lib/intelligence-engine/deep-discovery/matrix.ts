/**
 * Deep Discovery Matrix
 * Exhaustive taxonomy of source categories required to build a complete 
 * national intelligence picture for the cannabis ecosystem.
 */

export const SOURCE_TAXONOMY = {
  regulatory_and_legal: [
    'National Ministry/Department of Health',
    'National Medicines / Therapeutic Products Agency',
    'Narcotics / Controlled Substances Control Board',
    'Agricultural / Plant Health Ministry',
    'Customs & Border Protection / Revenue Agency',
    'National Legislature / Parliament (Official Gazette)',
    'Regional/State Health Departments (for decentralized nations)',
  ],
  commercial_and_trade: [
    'National Corporate Registry / Business Registrar',
    'National Import/Export Trade Data Portals',
    'Public Procurement Portals',
    'Public Stock Exchanges (financial filings)',
  ],
  scientific_and_medical: [
    'National Medical / Pharmacy Association',
    'National Clinical Trial Registries',
    'Major University Research Institutes (Agronomy / Medicine / Pharmacology)',
    'National Patents and Trademarks Office',
  ],
  infrastructure_and_compliance: [
    'National Accreditation Bodies (GMP, ISO)',
    'Environmental Protection / Waste Management Agencies',
    'Labor and Workplace Safety Boards',
  ]
};

export interface ResolvedEntity {
  country_code: string;
  category: string;
  role: string;
  official_name_local: string;
  official_name_english: string;
  primary_url: string | null;
  confidence: number;
}
