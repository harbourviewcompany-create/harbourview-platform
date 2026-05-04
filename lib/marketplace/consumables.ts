export const CONSUMABLES_CATEGORY = 'Consumables & Operating Supplies' as const;

export const CONSUMABLES_SUBCATEGORIES = [
  'Packaging',
  'Lab & QA Supplies',
  'Cultivation Supplies',
  'Processing Supplies',
  'Sanitation & PPE',
  'Logistics & Warehouse Supplies',
  'Retail Supplies',
  'Maintenance Consumables',
] as const;

export const CONSUMABLES_LISTING_TYPES = [
  'Supply Listing',
  'Supplier Directory Entry',
  'Wanted Consumables Request',
] as const;

export const PUBLIC_CONSUMABLES_LABELS = [
  'Inquiry Required',
  'Supplier Qualification Required',
  'Specifications available upon inquiry',
  'Bulk supply category',
  'Operating supplies category',
] as const;

const EXCLUDED_CONSUMABLE_TERMS = [
  'flower',
  'trim',
  'biomass',
  'extract',
  'oil',
  'distillate',
  'isolate',
  'api',
  'seed',
  'clone',
  'genetics',
  'pesticide',
  'restricted chemical',
  'controlled solvent',
  'prescription',
  'medical product',
] as const;

export type ConsumablesSubcategory = (typeof CONSUMABLES_SUBCATEGORIES)[number];
export type ConsumablesListingType = (typeof CONSUMABLES_LISTING_TYPES)[number];

export function isConsumablesSubcategory(value: string): value is ConsumablesSubcategory {
  return (CONSUMABLES_SUBCATEGORIES as readonly string[]).includes(value);
}

export function isConsumablesListingType(value: string): value is ConsumablesListingType {
  return (CONSUMABLES_LISTING_TYPES as readonly string[]).includes(value);
}

export function findExcludedConsumablesTerms(value: string) {
  const haystack = value.toLowerCase();
  return EXCLUDED_CONSUMABLE_TERMS.filter((term) => {
    const pattern = new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
    return pattern.test(haystack);
  });
}

export type CandidateDraftReviewInput = {
  marketplace_category: string;
  subcategory: string | null;
  listing_type: string | null;
  title_public_draft: string | null;
  description_public_draft: string | null;
  title_internal: string | null;
  description_internal: string | null;
  restricted_item: boolean;
  requires_license_review: boolean;
};

export function getDraftApprovalBlockers(candidate: CandidateDraftReviewInput) {
  const blockers: string[] = [];
  const combinedText = [
    candidate.title_internal,
    candidate.description_internal,
    candidate.title_public_draft,
    candidate.description_public_draft,
  ].filter(Boolean).join(' ');
  const excludedTerms = findExcludedConsumablesTerms(combinedText);

  if (candidate.marketplace_category !== CONSUMABLES_CATEGORY) {
    blockers.push('Invalid marketplace category.');
  }

  if (!candidate.subcategory || !isConsumablesSubcategory(candidate.subcategory)) {
    blockers.push('Invalid or missing consumables subcategory.');
  }

  if (!candidate.listing_type || !isConsumablesListingType(candidate.listing_type)) {
    blockers.push('Invalid or missing listing type.');
  }

  if (!candidate.title_public_draft?.trim()) {
    blockers.push('Public draft title is required.');
  }

  if (!candidate.description_public_draft?.trim()) {
    blockers.push('Public draft description is required.');
  }

  if (candidate.restricted_item || excludedTerms.length > 0) {
    blockers.push('This candidate is restricted in V0 and cannot be approved for public marketplace use.');
  }

  if (candidate.requires_license_review) {
    blockers.push('This candidate requires licence review and cannot be approved for public marketplace use in V0.');
  }

  return blockers;
}
