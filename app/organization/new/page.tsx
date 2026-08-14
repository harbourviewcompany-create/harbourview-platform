import type { Metadata } from 'next'
import OrganizationCreateForm from './OrganizationCreateForm'

export const metadata: Metadata = {
  title: 'Create Organization | Harbourview',
  description: 'Create an organization workspace and operating context in Harbourview.',
}

export default function CreateOrganizationPage() {
  return <OrganizationCreateForm />
}
