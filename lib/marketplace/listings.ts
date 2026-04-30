export type MarketplaceSection =
  | 'Used & Surplus'
  | 'New Products'
  | 'Supplier Directory'
  | 'Lab & Testing Equipment';

export type VerificationStatus =
  | 'source_verified'
  | 'availability_unverified'
  | 'seller_contact_required'
  | 'sold_or_expired_source';

export type MarketplaceListing = {
  slug: string;
  title: string;
  section: MarketplaceSection;
  category: string;
  listingType: string;
  condition?: 'Used' | 'New' | 'Supplier Lead' | 'Auction';
  price?: string;
  location?: string;
  sourceName: string;
  sourceUrl: string;
  seller?: string;
  contact?: string;
  summary: string;
  buyerFit: string[];
  verificationStatus: VerificationStatus;
  verificationNote: string;
  complianceNote: string;
  ctaLabel: string;
  priority: 'High' | 'Medium' | 'Low';
};

export const marketplaceListings: MarketplaceListing[] = [
  {
    slug: 'cascade-tek-cvo-5-l-vacuum-oven',
    title: 'Cascade TEK CVO-5-L Vacuum Oven',
    section: 'Used & Surplus',
    category: 'Lab / Extraction Support Equipment',
    listingType: 'Used equipment listing',
    condition: 'Used',
    price: '$30,000 USD listed by source',
    location: 'Massachusetts, US',
    sourceName: 'LabX / EquipNet',
    sourceUrl: 'https://www.labx.com/item/cascade-tek-model-cvo-5-l-vacuum-oven/DIS-101429-1058497',
    seller: 'EquipNet',
    summary:
      'Used Cascade TEK Model CVO-5-L laboratory-grade vacuum oven listed through LabX by EquipNet. Relevant to extraction-support, laboratory drying and controlled processing workflows.',
    buyerFit: ['Extraction labs', 'R&D facilities', 'Botanical processors', 'Controlled drying workflows'],
    verificationStatus: 'availability_unverified',
    verificationNote:
      'Source page shows condition, seller, location and listed price. Availability must be confirmed before introduction.',
    complianceNote:
      'Buyer must verify installation requirements, condition, service history, electrical requirements and suitability for intended regulated use.',
    ctaLabel: 'Request seller verification',
    priority: 'High'
  },
  {
    slug: 'cascade-tek-cvo-5-l-vacuum-oven-cold-trap-pump',
    title: 'Cascade TEK CVO-5-L Vacuum Oven with Cold Trap and Pump',
    section: 'Used & Surplus',
    category: 'Lab / Extraction Support Equipment',
    listingType: 'Used equipment package',
    condition: 'Used',
    price: '$30,000 USD listed by source',
    location: 'Massachusetts, US',
    sourceName: 'LabX / EquipNet',
    sourceUrl:
      'https://www.labx.com/item/cascade-tek-model-cvo-5-l-vacuum-oven-with-cold-trap-and/DIS-101429-1058498',
    seller: 'EquipNet',
    summary:
      'Used Cascade TEK CVO-5-L vacuum oven package with cold trap and pump listed through LabX by EquipNet.',
    buyerFit: ['Extraction labs', 'Processors', 'R&D facilities', 'Used equipment buyers'],
    verificationStatus: 'availability_unverified',
    verificationNote:
      'Source page shows seller, condition, location and listed price. Included components and availability must be reconfirmed.',
    complianceNote:
      'Buyer must verify condition, included pump and trap configuration, service history, electrical requirements and safe-use suitability.',
    ctaLabel: 'Request package details',
    priority: 'High'
  },
  {
    slug: 'perkinelmer-qsight-210-md-lc-ms-ms-system',
    title: 'PerkinElmer QSight 210 MD LC-MS/MS System',
    section: 'Lab & Testing Equipment',
    category: 'Analytical Testing Equipment',
    listingType: 'Used lab equipment listing',
    condition: 'Used',
    price: 'Price on source request / auction context',
    location: 'Source listing',
    sourceName: 'LabX',
    sourceUrl: 'https://www.labx.com/item/perkinelmer-qsight-210-md-lc-ms-ms-system/DIS-109215-1058935',
    seller: 'Source seller via LabX',
    summary:
      'Used PerkinElmer QSight LC-MS/MS analytical system lead. Relevant to laboratories evaluating cannabinoid, contaminant or broader regulated product testing capacity.',
    buyerFit: ['Testing laboratories', 'R&D labs', 'Compliance labs', 'Analytical equipment buyers'],
    verificationStatus: 'availability_unverified',
    verificationNote:
      'Source listing identifies the equipment. Configuration, included modules, service history, software/licensing and current availability must be verified.',
    complianceNote:
      'Buyer must verify instrument suitability, validation requirements, calibration, service records and regulatory testing accreditation fit.',
    ctaLabel: 'Request lab-equipment verification',
    priority: 'High'
  },
  {
    slug: 'equipnet-online-auctions-lab-production-equipment',
    title: 'EquipNet Online Auctions — Lab and Production Equipment',
    section: 'Used & Surplus',
    category: 'Auction / Surplus Source',
    listingType: 'Auction source lead',
    condition: 'Auction',
    price: 'Auction pricing',
    location: 'Multiple locations',
    sourceName: 'EquipNet Auctions',
    sourceUrl: 'https://www.equipnet.com/auctions/',
    seller: 'EquipNet',
    summary:
      'Ongoing auction source for surplus laboratory, processing, packaging and production equipment that can generate repeated marketplace opportunities.',
    buyerFit: ['Used equipment buyers', 'Processors', 'Labs', 'Facility operators', 'Opportunity sourcing desk'],
    verificationStatus: 'seller_contact_required',
    verificationNote:
      'Auction lots change frequently. Harbourview should screen current lots before publishing specific assets.',
    complianceNote:
      'Each lot needs its own asset-level verification, inspection standard, buyer qualification and export/import feasibility review where applicable.',
    ctaLabel: 'Request current lot screen',
    priority: 'Medium'
  },
  {
    slug: 'machinio-cannabis-processing-equipment-source',
    title: 'Machinio Cannabis Processing Equipment Source',
    section: 'Used & Surplus',
    category: 'Used Equipment Source',
    listingType: 'Supplier/source directory lead',
    condition: 'Supplier Lead',
    price: 'Varies by listing',
    location: 'Multiple seller locations',
    sourceName: 'Machinio',
    sourceUrl: 'https://www.machinio.com/cat/cannabis-processing-equipment',
    seller: 'Multiple sellers via Machinio',
    summary:
      'Source page for used cannabis processing equipment listings. Useful as a recurring source for extraction, processing, packaging and handling equipment opportunities.',
    buyerFit: ['Processors', 'Cultivators expanding processing', 'Used equipment buyers', 'Marketplace sourcing desk'],
    verificationStatus: 'seller_contact_required',
    verificationNote:
      'Individual listings must be reviewed before any Harbourview marketplace listing is published or promoted.',
    complianceNote:
      'Each asset requires seller verification, operating condition review, ownership confirmation and logistics feasibility checks.',
    ctaLabel: 'Request sourced equipment screen',
    priority: 'Medium'
  },
  {
    slug: 'thc-label-solutions-cannabis-packaging-labels',
    title: 'THC Label Solutions — Cannabis Packaging Labels',
    section: 'Supplier Directory',
    category: 'Packaging / Label Supplier',
    listingType: 'Supplier directory lead',
    condition: 'Supplier Lead',
    price: 'Quote-based',
    location: 'Supplier direct',
    sourceName: 'THC Label Solutions',
    sourceUrl: 'https://thclabelsolutions.com/',
    seller: 'THC Label Solutions',
    summary:
      'Cannabis-focused packaging label supplier lead for operators seeking label production, brand packaging support and compliance-oriented packaging workflows.',
    buyerFit: ['Brands', 'Processors', 'Retail product teams', 'Packaging buyers'],
    verificationStatus: 'seller_contact_required',
    verificationNote:
      'Supplier capabilities, service regions, pricing model and Harbourview referral/partnership terms must be confirmed before directory activation.',
    complianceNote:
      'Buyer must verify label compliance requirements by jurisdiction and ensure final artwork/legal copy is approved by qualified counsel or compliance team.',
    ctaLabel: 'Request supplier introduction',
    priority: 'Medium'
  },
  {
    slug: 'marijuana-packaging-wholesale-cannabis-packaging',
    title: 'Marijuana Packaging — Wholesale Cannabis Packaging',
    section: 'New Products',
    category: 'Packaging / Consumables Supplier',
    listingType: 'Supplier product source',
    condition: 'New',
    price: 'Supplier catalog pricing / quote-based',
    location: 'Supplier direct',
    sourceName: 'Marijuana Packaging',
    sourceUrl: 'https://marijuanapackaging.com/',
    seller: 'Marijuana Packaging',
    summary:
      'Wholesale cannabis packaging supplier source for jars, bags, tubes, labels and packaging consumables. Potential directory or quote-routing candidate.',
    buyerFit: ['Brands', 'Retail product teams', 'Processors', 'Dispensary operators', 'Packaging procurement'],
    verificationStatus: 'seller_contact_required',
    verificationNote:
      'Supplier relationship, current catalog, regional shipping, MOQs and referral terms need direct confirmation.',
    complianceNote:
      'Buyer must verify child-resistant claims, packaging certifications, state/provincial compliance and material suitability before purchase.',
    ctaLabel: 'Request packaging quote path',
    priority: 'Medium'
  }
];

export const featuredMarketplaceListings = marketplaceListings.filter(
  listing => listing.priority === 'High'
);

export function getMarketplaceListing(slug: string) {
  return marketplaceListings.find(listing => listing.slug === slug);
}
