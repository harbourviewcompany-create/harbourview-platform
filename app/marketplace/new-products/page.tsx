import type { Metadata } from 'next'
import { ListingPageClient } from '@/components/marketplace/ListingPageClient'

export const metadata: Metadata = { title: 'New Products', description: 'New licensed cannabis products, genetics, extracts and inputs available for commercial supply through Harbourview.' }

export default function NewProductsPage() {
  return <ListingPageClient title="New Products" description="New licensed cannabis products, genetics, extracts and inputs available for commercial supply across regulated markets." category="new-products" />
}
