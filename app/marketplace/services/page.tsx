import type { Metadata } from 'next'
import { ListingPageClient } from '@/components/marketplace/ListingPageClient'

export const metadata: Metadata = { title: 'Services', description: 'Regulatory, logistics, lab, packaging and commercial services for cannabis operators.' }

export default function ServicesPage() {
  return <ListingPageClient title="Services" description="Regulatory, logistics, laboratory, packaging and commercial services for cannabis operators across regulated markets." category="services" />
}
