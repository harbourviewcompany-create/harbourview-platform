import type { Metadata } from 'next'
import { ListingPageClient } from '@/components/marketplace/ListingPageClient'

export const metadata: Metadata = { title: 'Business Opportunities', description: 'Licensing deals, distribution agreements, partnership opportunities and strategic assets in regulated cannabis markets.' }

export default function BusinessOpportunitiesPage() {
  return <ListingPageClient title="Business Opportunities" description="Licensing deals, distribution agreements, partnership opportunities and strategic assets in regulated cannabis markets." category="business-opportunities" />
}
