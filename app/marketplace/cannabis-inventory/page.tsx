import type { Metadata } from 'next'
import { ListingPageClient } from '@/components/marketplace/ListingPageClient'

export const metadata: Metadata = { title: 'Cannabis Inventory', description: 'Available bulk flower, oil, extract and formulated product inventory from licensed facilities.' }

export default function CannabisInventoryPage() {
  return <ListingPageClient title="Cannabis Inventory" description="Available bulk flower, oil, extract and formulated product inventory from licensed facilities across key export markets." category="cannabis-inventory" />
}
