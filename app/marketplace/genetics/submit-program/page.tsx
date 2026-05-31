import type { Metadata } from 'next'
import GeneticsSubmitProgramForm from './GeneticsSubmitProgramForm'

export const metadata: Metadata = {
  title: 'Submit Genetics Program | Harbourview Marketplace',
  description: 'Submit a genetics program listing for reviewed access through Harbourview. Controlled disclosure — Harbourview reviews all requests before any details are shared.',
}

export default function GeneticsSubmitProgramPage() {
  return <GeneticsSubmitProgramForm />
}
