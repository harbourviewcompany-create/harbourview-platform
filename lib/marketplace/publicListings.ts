import { getMarketplaceListing, marketplaceListings, type MarketplaceListing } from './listings';
import { softLaunchSeedListings } from './softLaunchSeedListings';

const publicSummaries: Record<MarketplaceListing['slug'], string> = {
  'cascade-tek-cvo-5-l-vacuum-oven':
    'Used laboratory vacuum oven candidate relevant to extraction-support, R&D and controlled drying workflows. Harbourview qualifies current availability, configuration and counterparty fit before introduction.',
  'cascade-tek-cvo-5-l-vacuum-oven-cold-trap-pump':
    'Used laboratory vacuum oven package candidate with ancillary equipment for extraction-support, processing and R&D workflows. Harbourview qualifies included components, availability and counterparty fit before introduction.',
  'perkinelmer-qsight-210-md-lc-ms-ms-system':
    'Used LC-MS/MS analytical system candidate for laboratories evaluating regulated testing, contaminant analysis or broader product testing capacity. Harbourview qualifies configuration, service status and buyer fit before introduction.',
  'equipnet-online-auctions-lab-production-equipment':
    'Recurring surplus equipment opportunity category covering laboratory, processing, packaging and production assets. Harbourview screens current equipment opportunities before any buyer handoff.',
  'machinio-cannabis-processing-equipment-source':
    'Used cannabis processing equipment opportunity category covering extraction, processing, packaging and handling assets. Harbourview qualifies specific assets before any introduction.',
  'thc-label-solutions-cannabis-packaging-labels':
    'Cannabis-focused packaging and label opportunity for operators seeking label production, brand packaging support and compliance-oriented packaging workflows. Harbourview qualifies service fit and commercial path before introduction.',
  'marijuana-packaging-wholesale-cannabis-packaging':
    'Wholesale cannabis packaging opportunity for jars, bags, tubes, labels and packaging consumables. Harbourview qualifies quote path, regional fit and commercial requirements before introduction.'
};

const FORBIDDEN_PUBLIC_PATTERNS = [
  /supplier directory/i,
  /source-backed/i,
  /source listing/i,
  /supplier direct/i,
  /listed by source/i,
  /seller shown as/i,
  /source page/i,
  /supplier website/i,
  /source url/i,
  /source seller/i,
  /supplier lead/i,
  /directory lead/i,
  /source directory/i,
  /equipnet/i,
  /labx/i,
  /machinio/i,
  /thc label solutions/i,
  /marijuana packaging/i,
];

function publicSafeText(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (FORBIDDEN_PUBLIC_PATTERNS.some((pattern) => pattern.test(value))) return fallback;
  return value.replace(/\s+listed by source/i, '').trim();
}

function publicSafeSection(section: MarketplaceListing['section']) {
  if (section === 'Supplier Directory') return 'Featured Opportunities';
  return publicSafeText(section, 'Featured Opportunities');
}

function publicSafeList(values: string[], fallback: string) {
  const safeValues = values
    .map((value) => publicSafeText(value, fallback))
    .filter((value, index, arr) => value && arr.indexOf(value) === index);

  return safeValues.length ? safeValues : [fallback];
}

function publicPrice(price?: string) {
  if (!price) return undefined;
  if (FORBIDDEN_PUBLIC_PATTERNS.some((pattern) => pattern.test(price))) return 'Confirm through Harbourview';
  if (/source request|auction context|auction pricing/i.test(price)) return 'Price on request';
  if (/catalog pricing|quote-based/i.test(price)) return 'Quote-based';
  if (/varies by listing/i.test(price)) return 'Available on request';
  return price.replace(/\s+listed by source/i, '').trim();
}

function publicLocation(location?: string) {
  if (!location) return undefined;
  if (FORBIDDEN_PUBLIC_PATTERNS.some((pattern) => pattern.test(location))) return 'Available on request';
  if (/source listing|supplier direct/i.test(location)) return 'Available on request';
  return location;
}

export type PublicMarketplaceListing = Pick<MarketplaceListing,
  | 'slug'
  | 'condition'
> & {
  title: string;
  section: string;
  category: string;
  listingType: string;
  price?: string;
  location?: string;
  publicSummary: string;
  buyerFit: string[];
  complianceNote: string;
  ctaLabel: string;
};

export function toPublicMarketplaceListing(listing: MarketplaceListing): PublicMarketplaceListing {
  return {
    slug: listing.slug,
    title: publicSafeText(listing.title, 'Reviewed commercial opportunity'),
    section: publicSafeSection(listing.section),
    category: publicSafeText(listing.category, 'Commercial Opportunity'),
    listingType: publicSafeText(listing.listingType, 'Reviewed opportunity'),
    condition: listing.condition,
    price: publicPrice(listing.price),
    location: publicLocation(listing.location),
    publicSummary: publicSafeText(
      publicSummaries[listing.slug],
      'Reviewed commercial opportunity. Harbourview qualifies documentation, counterparty fit and commercial path before introduction.'
    ),
    buyerFit: publicSafeList(listing.buyerFit, 'Qualified buyers'),
    complianceNote: publicSafeText(
      listing.complianceNote,
      'Harbourview reviews documentation, commercial fit and applicable requirements before any introduction.'
    ),
    ctaLabel: publicSafeText(listing.ctaLabel, 'Request introduction'),
  };
}

export const publicMarketplaceListings = [
  ...marketplaceListings.map(toPublicMarketplaceListing),
  ...softLaunchSeedListings,
];

export function getPublicMarketplaceListing(slug: string) {
  const listing = getMarketplaceListing(slug);
  if (listing) return toPublicMarketplaceListing(listing);
  return softLaunchSeedListings.find((seedListing) => seedListing.slug === slug);
}
