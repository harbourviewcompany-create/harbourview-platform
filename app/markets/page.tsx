import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Harbourview Markets',
  description:
    'Jurisdiction orientation, import and export pathway context, public-safe opportunity categories, signals and market brief routing.',
}

export default function MarketsPage() {
  return <InstitutionalPage page={hubPages.markets} />
}
