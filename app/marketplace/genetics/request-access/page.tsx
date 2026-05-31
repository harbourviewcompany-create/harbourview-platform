import type { Metadata } from 'next'
import GeneticsRequestForm from './GeneticsRequestForm'

export const metadata: Metadata = {
  title: 'Request Genetics Access | Harbourview Marketplace',
  description: 'Submit a reviewed genetics access request. Harbourview controls whether any inquiry, identity or context is shared with a genetics holder.',
}

export default function GeneticsRequestAccessPage() {
  return <GeneticsRequestForm />
}
