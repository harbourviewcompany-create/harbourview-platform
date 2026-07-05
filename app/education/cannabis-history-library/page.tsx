import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Cannabis History Library | Harbourview Education',
  description:
    'Public-safe cannabis history and market development library entry point for education and institutional collaboration.',
}

export default function CannabisHistoryLibraryPage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-40 history and literacy"
      title="A public history and market-development library surface."
      description="This route gives Harbourview a controlled place for cannabis history, policy evolution, institutional milestones, market development and public-literacy resources without presenting unsourced historical claims as definitive."
      boundary="This page is a library and request surface. It does not publish unsourced historical claims, official government positions, legal conclusions, investment advice or current regulatory determinations."
      primaryAction={{ label: 'Request Library Collaboration', href: '/institutional-partnerships' }}
      secondaryAction={{ label: 'Contact Harbourview', href: '/contact', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Library structure',
          title: 'What belongs in the history layer',
          description: 'The route creates the shelf structure before deep source-backed articles are added.',
          items: [
            'Medical cannabis policy evolution, professionalization, pharmacy-channel development and institutional participation.',
            'Commercial market development, quality-system maturation, international trade pathways and standards formation.',
            'Advocacy, patient access, public-health safeguards and responsible market conduct topics.',
            'Country and regional timelines that remain source-led and separated from live legal or regulatory advice.',
          ],
        },
        {
          eyebrow: 'Publication discipline',
          title: 'How future history content should be governed',
          description: 'The library should support education while preserving source confidence and correction discipline.',
          items: [
            'Separate official sources, reported history, expert interpretation and unresolved points.',
            'Avoid turning historical context into current compliance claims or market-entry instructions.',
            'Use correction and update language where better public evidence becomes available.',
            'Route institutional, research and association collaboration through reviewed partnership paths.',
          ],
        },
      ]}
      footerTitle="Turn history into an institutional resource."
      footerDescription="The library route is ready for source-backed articles, timelines, educational collaborations and market-development explainers after source review."
    />
  )
}
