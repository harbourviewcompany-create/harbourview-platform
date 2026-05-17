import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Source Methodology',
  description:
    'Public-safe explanation of Harbourview source discipline, review standards, confidence language and private evidence boundaries.',
}

export default function SourceMethodologyPage() {
  return <InstitutionalPage page={hubPages.sourceMethodology} />
}
