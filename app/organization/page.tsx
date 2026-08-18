import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrganizationManager from './OrganizationManager'

export const metadata: Metadata = {
  title: 'Organizations | Harbourview',
  description: 'Manage Harbourview organization memberships and invitations.',
}

export default function OrganizationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#020814] px-5 py-12 text-white/50">Loading organizations…</main>
      }
    >
      <OrganizationManager />
    </Suspense>
  )
}
