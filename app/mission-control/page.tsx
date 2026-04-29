import type { Metadata } from 'next'
import { MissionControlClient } from './MissionControlClient'

export const metadata: Metadata = {
  title: 'Harbourview Mission Control | Chatbot Orchestration Hub',
  description:
    'A controlled orchestration hub for generating, assigning, auditing and approving multi-agent AI work.',
}

export default function MissionControlPage() {
  return (
    <main className="hv-page-shell">
      <MissionControlClient />
    </main>
  )
}
