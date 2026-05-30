import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export default function ClinicalPage() {
  redirect('/network/clinical-education')
}
