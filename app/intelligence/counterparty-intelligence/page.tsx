import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Counterparty Intelligence',
  description:
    'Public-safe framing for reviewed commercial party discovery, confidential routing and private evidence handling.',
}

export default function CounterpartyIntelligencePage() {
  return <InstitutionalPage page={hubPages.intelligence} />
}
