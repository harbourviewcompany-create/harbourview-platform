import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Watchlists | Harbourview Intelligence',
  description:
    'Public-safe watchlist entry point for market, counterparty, category and route monitoring requests.',
}

export default function WatchlistsPage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-39 watchlists"
      title="Watchlists for markets, routes, categories and counterparties."
      description="Harbourview watchlists are a controlled way to track topics that matter commercially without turning the public site into a live dossier, public claims engine or open evidence repository."
      boundary="Public watchlist pages describe monitored themes and request paths only. They do not publish private watch records, raw evidence, internal review status, counterparty dossiers or route-sensitive source material."
      primaryAction={{ label: 'Request Watchlist Review', href: '/contact' }}
      secondaryAction={{ label: 'Start Confidential Intake', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Watch categories',
          title: 'What can be tracked at a public-safe level',
          description: 'Each category explains the monitoring theme without representing a live finding or private conclusion.',
          items: [
            'Markets: regulatory movement, access-model shifts, import/export context and institutional participation signals.',
            'Companies: public posture, role claims, operating categories, review triggers and counterparty-fit questions.',
            'Categories: flower, extract, equipment, services, labs, logistics, distressed assets and other commercial segments.',
            'Routes: exporter/importer alignment, documentation expectations, logistics questions and market-access friction points.',
          ],
        },
        {
          eyebrow: 'Request triage',
          title: 'How a watch request is handled',
          description: 'The intake path separates general public interest from private intelligence and commercial sensitivity.',
          items: [
            'General public questions can route to contact for review.',
            'Sensitive questions should use confidential intake before documents, counterparties or route details are shared.',
            'Harbourview can classify requests as education, intelligence brief, reviewed connection, marketplace routing or no-action.',
            'Published summaries, if any, must remain public-safe and avoid private evidence leakage.',
          ],
        },
      ]}
      footerTitle="Need a specific market or counterparty watched?"
      footerDescription="Submit the watch topic, market, role, category, decision need and sensitivity level so Harbourview can determine the correct review path."
    />
  )
}
