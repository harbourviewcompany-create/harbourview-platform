import type { Metadata } from 'next'
import { GlobeSameScreenRouterLanding } from '@/components/globe/GlobeSameScreenRouterLanding'

export const metadata: Metadata = {
  title: 'Harbourview | Start by Country',
  description:
    'Start with your country, role and intent. Harbourview routes regulated cannabis market access, intelligence, education and reviewed introductions through a simple country-first interface.',
  openGraph: {
    title: 'Harbourview | Start by Country',
    description:
      'A country-first Harbourview router for regulated cannabis market access, intelligence, education and reviewed introductions.',
  },
}

export default function HomePage() {
  return <GlobeSameScreenRouterLanding />
}
