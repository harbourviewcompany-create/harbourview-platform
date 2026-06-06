import type { Metadata } from 'next'
import { GlobeSameScreenRouterLanding } from '@/components/globe/GlobeSameScreenRouterLanding'

export const metadata: Metadata = {
  title: 'Regulated Cannabis Market Routing & Reviewed Intelligence | Harbourview',
  description:
    'Harbourview helps serious operators in regulated cannabis markets route reviewed requests, source public-safe intelligence, and begin country-specific commercial intake across tracked alpha jurisdictions. Coverage is partial and reviewed as available.',
  openGraph: {
    title: 'Harbourview — Regulated Cannabis Market Routing & Reviewed Intelligence',
    description:
      'Harbourview routes regulated cannabis operators through reviewed request workflows, public-safe intelligence, and country-specific commercial intake across tracked alpha jurisdictions. Coverage is partial and reviewed as available.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview — Regulated Cannabis Market Routing & Reviewed Intelligence',
    description:
      'Country-first intake, reviewed public-safe intelligence, and controlled request routing for regulated cannabis operators in tracked alpha jurisdictions.',
  },
}

export default function HomePage() {
  return <GlobeSameScreenRouterLanding />
}
