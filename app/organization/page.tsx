import type { Metadata } from 'next'
import OrganizationManager from './OrganizationManager'

export const metadata: Metadata = {
  title: 'Organizations | Harbourview',
  description: 'Manage Harbourview organization memberships and invitations.',
}

export default function OrganizationPage() {
  return <OrganizationManager />
}
