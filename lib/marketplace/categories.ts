import type { ListingCategory } from '@/lib/supabase/types'

export interface CategoryMeta {
  slug: ListingCategory | 'wanted-requests' | 'supplier-directory'
  label: string
  href: string
  description: string
  icon: string
}

export const MARKETPLACE_CATEGORIES: CategoryMeta[] = [
  {
    slug: 'new-products',
    label: 'New Products',
    href: '/marketplace/new-products',
    description: 'New licensed cannabis products, genetics, extracts and inputs available for commercial supply.',
    icon: '⬡',
  },
  {
    slug: 'used-surplus',
    label: 'Used & Surplus',
    href: '/marketplace/used-surplus',
    description: 'Surplus inventory, equipment, packaging and materials from licensed operators.',
    icon: '◈',
  },
  {
    slug: 'cannabis-inventory',
    label: 'Cannabis Inventory',
    href: '/marketplace/cannabis-inventory',
    description: 'Available bulk flower, oil, extract and formulated product inventory from licensed facilities.',
    icon: '◉',
  },
  {
    slug: 'wanted-requests',
    label: 'Wanted Requests',
    href: '/marketplace/wanted-requests',
    description: 'Active buyer and importer requirements — post what you are seeking.',
    icon: '◎',
  },
  {
    slug: 'services',
    label: 'Services',
    href: '/marketplace/services',
    description: 'Regulatory, logistics, lab, packaging and commercial services for cannabis operators.',
    icon: '◫',
  },
  {
    slug: 'business-opportunities',
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description: 'Licensing deals, distribution agreements, partnership opportunities and strategic assets.',
    icon: '◆',
  },
  {
    slug: 'supplier-directory',
    label: 'Supplier Directory',
    href: '/marketplace/supplier-directory',
    description: 'Verified suppliers, manufacturers and service providers across regulated markets.',
    icon: '◇',
  },
]

export const LISTING_CATEGORY_SLUGS: ListingCategory[] = [
  'new-products',
  'used-surplus',
  'cannabis-inventory',
  'services',
  'business-opportunities',
]

export const SELLER_TYPES = [
  'Licensed Producer',
  'Cultivator',
  'Processor',
  'Manufacturer',
  'Brand',
  'Distributor',
  'Wholesaler',
  'Service Provider',
  'Operator',
  'Other',
] as const

export const BUYER_TYPES = [
  'Importer',
  'Distributor',
  'Wholesaler',
  'Pharmacy',
  'Operator',
  'Licensed Producer',
  'Investor',
  'Other',
] as const

export const REGIONS = [
  'Canada',
  'Germany',
  'United Kingdom',
  'Australia',
  'Brazil',
  'France',
  'New Zealand',
  'Poland',
  'Netherlands',
  'Portugal',
  'Israel',
  'Thailand',
  'United States',
  'European Union',
  'Latin America',
  'Asia-Pacific',
  'Global',
  'Other',
] as const

export const PRICE_RANGES = [
  'Under $1,000',
  '$1,000 – $10,000',
  '$10,000 – $100,000',
  '$100,000 – $500,000',
  '$500,000+',
  'Negotiable',
  'Contact for pricing',
] as const

export const LISTING_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
  'archived',
  'superseded',
] as const

export const MATCH_STATUSES = [
  'proposed',
  'inquiry_received',
  'disclosure_requested',
  'disclosure_approved',
  'introduced',
  'closed_won',
  'closed_lost',
] as const
