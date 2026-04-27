import type { Metadata } from 'next'
import { ListingPageClient } from '@/components/marketplace/ListingPageClient'

export const metadata: Metadata = { title: 'Used & Surplus', description: 'Surplus inventory, equipment, packaging and materials from licensed cannabis operators.' }

export default function UsedSurplusPage() {
  return <ListingPageClient title="Used & Surplus" description="Surplus inventory, equipment, packaging and materials from licensed operators seeking efficient disposition." category="used-surplus" />
}
