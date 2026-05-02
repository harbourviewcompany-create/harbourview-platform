import type { Metadata } from 'next'
import HarbourviewHomePage from '@/components/harbourview/HarbourviewHomePage'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
  description:
    'Harbourview helps serious operators identify qualified supply, buyer demand, commercial opportunities and market-entry pathways across regulated cannabis and adjacent supply chains.',
  openGraph: {
    title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
    description:
      'Harbourview helps serious operators identify qualified supply, buyer demand, commercial opportunities and market-entry pathways across regulated cannabis and adjacent supply chains.',
  },
}

export default function HomePage() {
  return <HarbourviewHomePage />
}
