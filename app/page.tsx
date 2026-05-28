import type { Metadata } from 'next'
import { GlobeSameScreenRouterLanding } from '@/components/globe/GlobeSameScreenRouterLanding'

export const metadata: Metadata = {
  title: 'Regulated Cannabis Market Access, Intelligence & Introductions | Harbourview',
  description:
    'Harbourview helps serious operators in regulated cannabis markets access reviewed intelligence, qualified counterparties, and country-specific commercial pathways. Start by country.',
  openGraph: {
    title: 'Harbourview — Regulated Cannabis Market Access & Intelligence',
    description:
      'Harbourview routes serious operators in regulated cannabis markets to reviewed intelligence, qualified introductions, and country-specific access pathways. Start by country.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview — Regulated Cannabis Market Access & Intelligence',
    description:
      'Country-first market access, reviewed intelligence, and controlled introductions for regulated cannabis operators in represented markets.',
  },
}

export default function HomePage() {
  return <GlobeSameScreenRouterLanding />
}
