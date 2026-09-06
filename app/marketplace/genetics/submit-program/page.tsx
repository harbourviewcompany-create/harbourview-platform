import type { Metadata } from 'next'
import GeneticsSubmitProgramForm from './GeneticsSubmitProgramForm'

export const metadata: Metadata = {
  title: 'Submit Genetics Program | Harbourview Exchange',
  description: 'Submit a genetics program for Harbourview review.',
}

export default function GeneticsSubmitProgramPage() {
  return <GeneticsSubmitProgramForm />
}
