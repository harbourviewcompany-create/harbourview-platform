import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Submit Consumables | Harbourview Exchange',
  description: 'Submit consumables supply for Harbourview review.',
}

export default function SellConsumablesPage() {
  redirect('/marketplace/sell')
}
