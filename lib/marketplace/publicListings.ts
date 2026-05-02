import { getMarketplaceListing, marketplaceListings, type MarketplaceListing } from './listings';

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
    'Cannabis-focused packaging and label supplier candidate for operators seeking label production, brand packaging support and compliance-oriented packaging workflows. Harbourview qualifies service fit and commercial path before introduction.',
  'marijuana-packaging-wholesale-cannabis-packaging':
    'Wholesale cannabis packaging supplier candidate for jars, bags, tubes, labels and packaging consumables. Harbourview qualifies quote path, regional fit and commercial requirements before introduction.'
};

function publicPrice(price?: string) {
  if (!price) return undefined;
  if (/source request|auction context|auction pricing/i.test(price)) return 'Price on request';
  if (/catalog pricing|quote-based/i.test(price)) return 'Quote-based';
  if (/varies by listing/i.test(price)) return 'Available on request';
  return price.replace(/\s+listed by source/i, '').trim();
}

function publicLocation(location?: string) {
  if (!location) return undefined;
  if (/source listing|supplier direct/i.test(location)) return 'Available on request';
  return location;
}

export type PublicMarketplaceListing = Pick<MarketplaceListing,
  | 'slug'
  | 'title'
  | 'section'
  | 'category'
  | 'listingType'
  | 'condition'
  | 'buyerFit'
  | 'complianceNote'
  | 'ctaLabel'
> & {
  price?: string;
  location?: string;
  publicSummary: string;
};

export function toPublicMarketplaceListing(listing: MarketplaceListing): PublicMarketplaceListing {
  return {
    slug: listing.slug,
    title: listing.title,
    section: listing.section,
    category: listing.category,
    listingType: listing.listingType,
    condition: listing.condition,
    price: publicPrice(listing.price),
    location: publicLocation(listing.location),
    publicSummary: publicSummaries[listing.slug],
    buyerFit: listing.buyerFit,
    complianceNote: listing.complianceNote,
    ctaLabel: listing.ctaLabel,
  };
}

export const publicMarketplaceListings = marketplaceListings.map(toPublicMarketplaceListing);

export function getPublicMarketplaceListing(slug: string) {
  const listing = getMarketplaceListing(slug);
  return listing ? toPublicMarketplaceListing(listing) : undefined;
}
