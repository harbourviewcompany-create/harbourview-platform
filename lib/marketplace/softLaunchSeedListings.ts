import type { PublicMarketplaceListing } from './publicListings';

export const softLaunchSeedListings: PublicMarketplaceListing[] = [
  {
    slug: 'soft-launch-used-extraction-chiller-package',
    title: 'Used Extraction Chiller Package - Qualification Required',
    section: 'Used & Surplus',
    category: 'Extraction Support Equipment',
    listingType: 'Soft-launch equipment candidate',
    condition: 'Used',
    price: 'Confirm through Harbourview',
    location: 'North America',
    publicSummary:
      'Soft-launch used chiller package candidate for extraction-support and temperature-control workflows. Harbourview qualifies seller authorization, configuration, service history and current availability before introduction.',
    buyerFit: ['Extraction labs', 'Processors', 'Used equipment buyers', 'Facility operators'],
    complianceNote:
      'Buyer must verify refrigerant and service status, electrical requirements, operating condition, installation fit and regulated-use suitability before purchase.',
    ctaLabel: 'Request chiller package screen',
  },
  {
    slug: 'soft-launch-bulk-child-resistant-packaging-supply',
    title: 'Bulk Child-Resistant Packaging Supply - Quote Path',
    section: 'New Products',
    category: 'Packaging / Consumables',
    listingType: 'Soft-launch supplier quote candidate',
    condition: 'New',
    price: 'Quote-based',
    location: 'Available on request',
    publicSummary:
      'Soft-launch packaging supply candidate for operators seeking jars, tubes, pouches or related child-resistant packaging at volume. Harbourview qualifies supplier fit, MOQ, shipping region and quote path before handoff.',
    buyerFit: ['Brands', 'Processors', 'Retail operators', 'Packaging procurement teams'],
    complianceNote:
      'Buyer must verify jurisdiction-specific packaging, labeling, child-resistant and material compliance requirements before ordering.',
    ctaLabel: 'Request packaging quote path',
  },
  {
    slug: 'soft-launch-cultivation-facility-equipment-package',
    title: 'Cultivation Facility Equipment Package - Buyer Screen',
    section: 'Business Opportunities',
    category: 'Facility / Cultivation Equipment',
    listingType: 'Soft-launch opportunity candidate',
    condition: 'Supplier Lead',
    price: 'Available on request',
    location: 'North America',
    publicSummary:
      'Soft-launch facility equipment package candidate for operators evaluating cultivation expansion, retrofit or asset acquisition. Harbourview screens asset scope, seller authorization, removal logistics and buyer fit before introduction.',
    buyerFit: ['Cultivators', 'Facility buyers', 'Expansion teams', 'Asset acquisition teams'],
    complianceNote:
      'Buyer must verify equipment ownership, condition, deinstallation requirements, site constraints, transfer logistics and local regulatory fit.',
    ctaLabel: 'Request facility package review',
  },
];
