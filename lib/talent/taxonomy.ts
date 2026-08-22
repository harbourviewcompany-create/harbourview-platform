/**
 * Harbourview Talent — role taxonomy
 * Keep in sync with DB check constraints and filter chips.
 */

import type { RoleFamily, Seniority, EmploymentType, LocationType } from '@/types/talent';

export const ROLE_FAMILIES: Record<
  RoleFamily,
  { label: string; examples: string[] }
> = {
  regulatory_affairs: {
    label: 'Regulatory Affairs',
    examples: [
      'Regulatory Affairs Manager — Cannabis (CanG)',
      'Global RA Director',
      'CMC Regulatory Specialist',
    ],
  },
  compliance_licensing: {
    label: 'Compliance & Licensing',
    examples: [
      'Compliance Manager',
      'Licensing Specialist',
      'State Compliance Lead',
    ],
  },
  quality_gxp: {
    label: 'Quality / GxP',
    examples: ['QA Manager', 'QC Analyst', 'EU-GMP Specialist'],
  },
  clinical_medical: {
    label: 'Clinical & Medical',
    examples: [
      'Medical Science Liaison',
      'Clinical Operations',
      'Prescriber Support',
    ],
  },
  cultivation_genetics: {
    label: 'Cultivation & Genetics',
    examples: ['Cultivation Director', 'Head Grower', 'Genetics Lead'],
  },
  extraction_manufacturing: {
    label: 'Extraction & Manufacturing',
    examples: [
      'Extraction Manager',
      'Formulation Scientist',
      'Process Engineer',
    ],
  },
  supply_chain_logistics: {
    label: 'Supply Chain & Logistics',
    examples: [
      'Supply Chain Manager',
      'Import/Export Specialist',
      'Warehouse Lead',
    ],
  },
  commercial_market_access: {
    label: 'Commercial / Market Access',
    examples: [
      'Market Access Manager',
      'Business Development Lead',
      'Tender Specialist',
    ],
  },
  finance_ops_legal: {
    label: 'Finance / Ops / Legal',
    examples: [
      'Controller (Cannabis)',
      'Corporate Counsel',
      'People Operations',
    ],
  },
  other_specialist: {
    label: 'Other / Specialist',
    examples: ['Lab Director', 'Security Lead', 'Seed-to-Sale Systems'],
  },
};

export const ROLE_FAMILY_OPTIONS = Object.entries(ROLE_FAMILIES).map(
  ([value, meta]) => ({
    value: value as RoleFamily,
    label: meta.label,
  })
);

export const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' },
];

export const EMPLOYMENT_TYPE_OPTIONS: {
  value: EmploymentType;
  label: string;
}[] = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
];

export const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] =
  [
    { value: 'onsite', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' },
  ];

/** Human-readable salary band helper */
export function formatSalaryBand(opts: {
  min: number | null;
  max: number | null;
  currency: string;
  period: string;
}): string | null {
  const { min, max, currency, period } = opts;
  if (min == null && max == null) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  const periodLabel =
    period === 'year'
      ? ''
      : period === 'month'
        ? '/mo'
        : period === 'hour'
          ? '/hr'
          : period === 'day'
            ? '/day'
            : '';

  if (min != null && max != null) {
    return `${fmt(min)}–${fmt(max)}${periodLabel}`;
  }
  if (min != null) return `From ${fmt(min)}${periodLabel}`;
  if (max != null) return `Up to ${fmt(max)}${periodLabel}`;
  return null;
}
