import type { Metadata } from 'next'
import OrganizationJoinForm from './OrganizationJoinForm'

export const metadata: Metadata = {
  title: 'Join Organization | Harbourview',
  description: 'Accept a Harbourview organization invitation.',
}

export default function JoinOrganizationPage() {
  return <OrganizationJoinForm />
}
