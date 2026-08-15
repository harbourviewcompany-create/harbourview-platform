import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrganizationJoinForm from './OrganizationJoinForm'

export const metadata: Metadata = {
  title: 'Join Organization | Harbourview',
  description: 'Accept a Harbourview organization invitation.',
}

export default function JoinOrganizationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#020814] px-5 py-12 text-white/50">Loading invitation…</main>}>
      <OrganizationJoinForm />
    </Suspense>
  )
}
