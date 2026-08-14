import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrganizationCreateForm from './OrganizationCreateForm'

export const metadata: Metadata = {
  title: 'Create Organization | Harbourview',
  description: 'Create an organization workspace and operating context in Harbourview.',
}

export default function CreateOrganizationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#020814] px-5 py-12 text-white/50">Loading organization setup…</main>}>
      <OrganizationCreateForm />
    </Suspense>
  )
}
