import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export default function CompliancePage() {
  redirect('/education/compliance-readiness')
}
