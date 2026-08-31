import type { Metadata } from 'next'
import GeneticsRequestForm from './GeneticsRequestForm'

export const metadata: Metadata = {
  title: 'Request Genetics Access | Harbourview Exchange',
  description: 'Request reviewed access to genetics programs through Harbourview.',
}

export default function GeneticsRequestAccessPage() {
  return <GeneticsRequestForm />
}
