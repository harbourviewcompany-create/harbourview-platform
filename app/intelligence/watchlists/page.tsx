import type { Metadata } from 'next'
import Link from 'next/link'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Watchlists | Harbourview Intelligence',
  description:
    'Public-safe watchlist entry point. Authenticated operators manage cc_watch_rules and watched items inside the Command Centre.',
}

export default function WatchlistsPage() {
  return (
    <PublicSurfacePage
      eyebrow="Watchlists"
      title="Track markets, routes, categories and counterparties."
      description="Harbourview watchlists let operators monitor commercially relevant themes without turning the public site into a live dossier or open evidence repository. Interactive rule management lives in the authenticated Command Centre."
      boundary="Public pages describe monitoring themes and request paths only. They do not publish private watch records, raw evidence, internal review status, or counterparty dossiers."
      primaryAction={{ label: 'Open Command Centre Watchlist', href: '/dashboard?page=intel' }}
      secondaryAction={{ label: 'My Briefings', href: '/dashboard?page=briefing', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Authenticated rule builder',
          title: 'What you can manage when signed in',
          description: 'The Command Centre watchlist page already supports full interactive management of org-scoped rules and items.',
          items: [
            'Add / pause / delete cc_watch_rules (keyword signal, jurisdiction change, marketplace listing, regulatory update, counterparty activity).',
            'Track watched items with resolve, snooze, next-action notes and confidence markers.',
            'Notification summary for awaiting / resolved / snoozed alerts.',
            'My Briefings assembles active rules with published jurisdiction briefings as the personalization spine.',
          ],
        },
        {
          eyebrow: 'Public-safe categories',
          title: 'What can be tracked at a public-safe level',
          description: 'Each category explains the monitoring theme without representing a live finding or private conclusion.',
          items: [
            'Markets: regulatory movement, access-model shifts, import/export context.',
            'Companies: public posture, role claims, operating categories, review triggers.',
            'Categories: flower, extract, equipment, services, labs, logistics, distressed assets.',
            'Routes: exporter/importer alignment, documentation expectations, logistics friction.',
          ],
        },
        {
          eyebrow: 'Request triage',
          title: 'How a public watch request is handled',
          description: 'The intake path separates general public interest from private intelligence.',
          items: [
            'General public questions can route to contact for review.',
            'Sensitive questions should use confidential intake before documents or route details are shared.',
            'Harbourview can classify requests as education, intelligence brief, reviewed connection, marketplace routing or no-action.',
          ],
        },
      ]}
      footerTitle="Need a specific market or counterparty watched?"
      footerDescription="Submit the watch topic, market, role, category, decision need and sensitivity level so Harbourview can determine the correct review path."
    />
  )
}
