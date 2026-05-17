import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Harbourview Platform Map',
  description:
    'The public Harbourview platform map across network access, exchange, intelligence, markets, education, professionals, governance and reviewed connections.',
}

export default function PlatformPage() {
  return <InstitutionalPage page={hubPages.platform} />
}
