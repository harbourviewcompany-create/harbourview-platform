import { countries, getCountryByIso2 } from '@/lib/dashboard/countries'
import { canadaProvinceProfiles } from '@/data/globe/canada-province-profiles'
import { usStateProfiles } from '@/data/globe/us-state-profiles'
import type { CountryOption, CountryRoleProfile, RoleId } from '@/types/globe-router'
import { allRoleIds } from './role-profiles'

const curatedCountryOrder = ['DE', 'CA', 'PT', 'NL', 'AU', 'GB', 'US', 'CO', 'UY', 'IL', 'ZA']

function mapDashboardCountryToOption(country: (typeof countries)[number]): CountryOption {
  return {
    iso2: country.iso2,
    iso3: country.iso3,
    name: country.displayName,
    region: country.region,
    subregion: country.subregion,
    aliases: country.aliases,
    dashboardStatus: country.dashboardStatus,
  }
}

export const countryOptions: CountryOption[] = [
  ...curatedCountryOrder
    .map((iso2) => countries.find((country) => country.iso2 === iso2))
    .filter((country): country is (typeof countries)[number] => Boolean(country))
    .map(mapDashboardCountryToOption),
  ...countries
    .filter((country) => !curatedCountryOrder.includes(country.iso2))
    .map(mapDashboardCountryToOption),
]

// Province options — injected after country options so provinces appear in search
const provinceOptions: CountryOption[] = canadaProvinceProfiles.map((p) => ({
  iso2: p.iso2,
  name: p.name,
  region: 'Americas',
  subregion: 'North America',
  aliases: [p.abbreviation, `${p.name} Canada`, `CA-${p.abbreviation}`],
  dashboardStatus: p.dashboardStatus,
}))

// US state options — injected after province options
const usStateOptions: CountryOption[] = usStateProfiles.map((s) => ({
  iso2: s.iso2,
  name: s.name,
  region: 'Americas',
  subregion: 'North America',
  aliases: [s.abbreviation, `${s.name} United States`, `${s.name} USA`, `US-${s.abbreviation}`],
  dashboardStatus: s.dashboardStatus,
}))

// Merge: provinces and states appear after main country list
export const allCountryAndProvinceOptions: CountryOption[] = [
  ...countryOptions,
  ...provinceOptions,
  ...usStateOptions,
]

export const countryOptionMap = Object.fromEntries(
  countryOptions.map((country) => [country.iso2, country]),
) as Record<string, CountryOption>

export const allCountryAndProvinceOptionMap = Object.fromEntries(
  allCountryAndProvinceOptions.map((country) => [country.iso2, country]),
) as Record<string, CountryOption>

export const defaultPrimaryRoleIds: RoleId[] = [
  'importer',
  'exporter',
  'doctor_prescriber',
  'pharmacist',
  'cultivator_producer',
  'lab_qa',
  'regulatory_compliance',
  'investor_operator',
  'not_sure',
]

const defaultSecondaryRoleIds: RoleId[] = allRoleIds.filter(
  (roleId) => !defaultPrimaryRoleIds.includes(roleId),
)

const exportMarketPrimaryRoleIds: RoleId[] = [
  'exporter',
  'importer',
  'gmp_quality',
  'logistics_customs',
  'distributor_wholesaler',
  'lab_qa',
  'cultivator_producer',
  'regulatory_compliance',
  'investor_operator',
  'not_sure',
]

// ── 30-country expansion (2026-07-09) — 6 shared role archetypes, same
// pattern as exportMarketPrimaryRoleIds above: one curated list per market
// shape rather than one per country. See HANDOFF.md session log for sourcing
// (cc_jurisdiction_briefings program_status + commercial priority).

// Tier 1 — EU medical-pharma markets with active import/export trade.
const euMedicalPharmaPrimaryRoleIds: RoleId[] = [
  'importer',
  'exporter',
  'gmp_quality',
  'distributor_wholesaler',
  'pharmacist',
  'doctor_prescriber',
  'lab_qa',
  'regulatory_compliance',
  'investor_operator',
  'not_sure',
]

// Tier 2 — smaller/named-patient-only medical programs. Compliance and legal
// lead over commercial roles since import/export volume is lower here.
const limitedMedicalPrimaryRoleIds: RoleId[] = [
  'doctor_prescriber',
  'pharmacist',
  'regulatory_compliance',
  'legal_advisory',
  'importer',
  'exporter',
  'gmp_quality',
  'investor_operator',
  'not_sure',
]

// Tier 3 — EU adult-use reform pioneers (personal cultivation legal,
// commercial licensing still forming). Investor/regulatory interest leads.
const euAdultUsePioneerPrimaryRoleIds: RoleId[] = [
  'regulatory_compliance',
  'legal_advisory',
  'cultivator_producer',
  'investor_operator',
  'government_regulator',
  'doctor_prescriber',
  'importer',
  'exporter',
  'not_sure',
]

// Tier 4 — export-production powerhouses. Same shape as Colombia/Uruguay
// (exportMarketPrimaryRoleIds) but production-first rather than trade-first.
const exportProductionPrimaryRoleIds: RoleId[] = [
  'cultivator_producer',
  'exporter',
  'gmp_quality',
  'lab_qa',
  'geneticist_breeder',
  'distributor_wholesaler',
  'regulatory_compliance',
  'investor_operator',
  'not_sure',
]

// Tier 5 — United States. Federal prohibition blocks legal cross-border
// trade, so no importer/exporter — this is a domestic-only role shape.
const usDomesticPrimaryRoleIds: RoleId[] = [
  'cultivator_producer',
  'retail_operator',
  'processor_extractor',
  'distributor_wholesaler',
  'regulatory_compliance',
  'legal_advisory',
  'investor_operator',
  'lab_qa',
  'not_sure',
]

// Tier 6 — Mexico. Medical legal, adult-use pending full regulation —
// regulatory-watch posture.
const mexicoPrimaryRoleIds: RoleId[] = [
  'regulatory_compliance',
  'legal_advisory',
  'cultivator_producer',
  'investor_operator',
  'distributor_wholesaler',
  'doctor_prescriber',
  'government_regulator',
  'not_sure',
]

export const defaultCountryRoleProfile: CountryRoleProfile = {
  countryIso2: 'GLOBAL',
  countryName: 'Global default',
  marketModel: 'unknown',
  primaryRoleIds: defaultPrimaryRoleIds,
  secondaryRoleIds: defaultSecondaryRoleIds,
  searchableRoleIds: allRoleIds,
}

export const countryRoleProfiles: CountryRoleProfile[] = [
  {
    countryIso2: 'DE',
    countryName: 'Germany',
    marketModel: 'medical',
    primaryRoleIds: [
      'importer',
      'exporter',
      'gmp_quality',
      'distributor_wholesaler',
      'pharmacist',
      'doctor_prescriber',
      'lab_qa',
      'regulatory_compliance',
      'investor_operator',
      'not_sure',
    ],
    secondaryRoleIds: [
      'cultivator_producer',
      'geneticist_breeder',
      'clinic_healthcare_operator',
      'legal_advisory',
      'patient_caregiver_education',
      'government_regulator',
      'logistics_customs',
    ],
    searchableRoleIds: allRoleIds,
    notes: 'Germany prioritizes medical, import, wholesale, pharmacy and quality pathways.',
  },
  {
    countryIso2: 'CA',
    countryName: 'Canada',
    marketModel: 'mixed',
    primaryRoleIds: [
      'cultivator_producer',
      'geneticist_breeder',
      'processor_extractor',
      'lab_qa',
      'exporter',
      'distributor_wholesaler',
      'retail_operator',
      'budtender',
      'doctor_prescriber',
      'regulatory_compliance',
      'investor_operator',
      'not_sure',
    ],
    secondaryRoleIds: [
      'pharmacist',
      'clinic_healthcare_operator',
      'importer',
      'legal_advisory',
      'patient_caregiver_education',
      'government_regulator',
      'gmp_quality',
      'logistics_customs',
    ],
    searchableRoleIds: allRoleIds,
    notes: 'Canada prioritizes licensed production, genetics, extraction, lab, export, retail and compliance pathways.',
  },
  ...['PT', 'NL', 'AU', 'GB', 'CO', 'UY', 'IL', 'ZA'].map((countryIso2) => ({
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
    marketModel: 'export' as const,
    primaryRoleIds: exportMarketPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !exportMarketPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'Export-market profile prioritizes cross-border, quality, logistics and review pathways.',
  })),

  // Tier 1 — EU medical-pharma, active import/export
  ...['GR', 'FR', 'ES', 'IT', 'CZ', 'PL', 'CH', 'AT', 'DK', 'IE', 'HR', 'CY', 'NO'].map((countryIso2) => ({
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
    marketModel: 'medical' as const,
    primaryRoleIds: euMedicalPharmaPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !euMedicalPharmaPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'EU medical-pharma profile prioritizes import, export, quality, distribution and pharmacy pathways.',
  })),

  // Tier 2 — smaller/limited medical programs
  ...['BE', 'SE', 'FI', 'RO', 'BG', 'SI', 'SK', 'IS'].map((countryIso2) => ({
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
    marketModel: 'medical' as const,
    primaryRoleIds: limitedMedicalPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !limitedMedicalPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'Limited-medical profile prioritizes clinical, pharmacy, compliance and legal pathways over commercial trade volume.',
  })),

  // Tier 3 — EU adult-use reform pioneers
  ...['MT', 'LU'].map((countryIso2) => ({
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
    marketModel: 'adult_use' as const,
    primaryRoleIds: euAdultUsePioneerPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !euAdultUsePioneerPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'Adult-use pioneer profile prioritizes compliance, legal and investor pathways while commercial licensing structures are still forming.',
  })),

  // Tier 4 — export-production powerhouses
  ...['MA', 'MK', 'LS', 'ZW', 'JM'].map((countryIso2) => ({
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
    marketModel: 'export' as const,
    primaryRoleIds: exportProductionPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !exportProductionPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'Export-production profile prioritizes cultivation, genetics, quality and export pathways.',
  })),

  // Tier 5 — United States: federal prohibition blocks legal cross-border
  // trade, so this is a domestic-only role shape (no importer/exporter).
  // Previously had no curated profile at all despite being in
  // curatedCountryOrder — silently fell back to the generic default, which
  // wrongly surfaced importer/exporter as primary roles for a market where
  // neither is legally reachable federally.
  {
    countryIso2: 'US',
    countryName: countryOptionMap['US']?.name ?? 'United States',
    marketModel: 'mixed',
    primaryRoleIds: usDomesticPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !usDomesticPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'US profile is domestic-only — federal Schedule I status blocks legal import/export; state programs vary.',
  },

  // Tier 6 — Mexico: medical legal, adult-use pending full regulation.
  {
    countryIso2: 'MX',
    countryName: countryOptionMap['MX']?.name ?? 'Mexico',
    marketModel: 'medical',
    primaryRoleIds: mexicoPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !mexicoPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'Regulatory-watch posture while adult-use framework moves toward full regulation.',
  },
]

export const countryRoleProfileMap = Object.fromEntries(
  countryRoleProfiles.map((profile) => [profile.countryIso2, profile]),
) as Record<string, CountryRoleProfile>

export function getCountryRoleProfile(countryIso2?: string): CountryRoleProfile {
  if (!countryIso2) return defaultCountryRoleProfile

  return countryRoleProfileMap[countryIso2] ?? {
    ...defaultCountryRoleProfile,
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? getCountryName(countryIso2),
  }
}

export function getCountryName(countryIso2?: string) {
  if (!countryIso2) return 'Selected market'

  // Primary: full dashboard-safe country registry used by both desktop and mobile routing.
  const tracked = allCountryAndProvinceOptionMap[countryIso2]
  if (tracked) return tracked.name

  // Fallback: full 196-country Natural Earth database.
  const full = getCountryByIso2(countryIso2)
  if (full) return full.displayName

  return countryIso2
}

export function getMultiMarketRoleIds(countryIso2s: string[]) {
  if (countryIso2s.length === 0) return defaultPrimaryRoleIds

  const roleCount = new Map<RoleId, number>()

  countryIso2s.forEach((countryIso2) => {
    getCountryRoleProfile(countryIso2).primaryRoleIds.forEach((roleId) => {
      roleCount.set(roleId, (roleCount.get(roleId) ?? 0) + 1)
    })
  })

  const crossBorderFirst: RoleId[] = [
    'importer',
    'exporter',
    'distributor_wholesaler',
    'gmp_quality',
    'regulatory_compliance',
    'investor_operator',
    'lab_qa',
    'not_sure',
  ]

  const sortedRoles = [...allRoleIds].sort((a, b) => {
    const priorityA = crossBorderFirst.indexOf(a)
    const priorityB = crossBorderFirst.indexOf(b)
    const weightedA = (roleCount.get(a) ?? 0) * 10 + (priorityA === -1 ? 0 : 9 - priorityA)
    const weightedB = (roleCount.get(b) ?? 0) * 10 + (priorityB === -1 ? 0 : 9 - priorityB)

    return weightedB - weightedA
  })

  const prioritizedCrossBorder = crossBorderFirst.filter((roleId) => sortedRoles.includes(roleId))
  const remainingRoles = sortedRoles.filter((roleId) => !prioritizedCrossBorder.includes(roleId))

  return [...prioritizedCrossBorder, ...remainingRoles]
}
