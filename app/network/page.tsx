import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Cannabis Industry Network — Operators, Buyers, Exporters & Professionals',
  description:
    'Role-specific entry points for every type of serious participant in regulated cannabis — operators, buyers, exporters, importers, professionals and institutions.',
  openGraph: {
    title: 'Harbourview Network — Controlled Cannabis Industry Access',
    description:
      'Role-specific discovery for regulated cannabis operators, buyers, exporters, importers, distributors, professionals, institutions and adjacent stakeholders.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview Network',
    description:
      'Role-specific entry points for every serious participant in regulated cannabis — operators, buyers, exporters, professionals and institutions.',
  },
}

export default function NetworkPage() {
  return <InstitutionalPage page={hubPages.network} />
}
