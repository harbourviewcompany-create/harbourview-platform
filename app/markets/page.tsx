import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Regulated Cannabis Markets — Jurisdiction Status & Import/Export Pathways',
  description:
    'Country-level orientation for import and export pathways, access model status, opportunity categories and regulatory signals for represented regulated cannabis markets.',
  openGraph: {
    title: 'Regulated Cannabis Markets — Jurisdiction Pathways | Harbourview',
    description:
      'Public-safe orientation for country status, import and export pathways, opportunity categories and regulatory signals for represented regulated cannabis markets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cannabis Market Jurisdictions — Harbourview',
    description:
      'Country status, import/export pathway orientation and regulatory signals for represented regulated cannabis markets.',
  },
}

export default function MarketsPage() {
  return <InstitutionalPage page={hubPages.markets} />
}
