import { redirect } from 'next/navigation'

/** Operator-owned submissions — not a public surface. */
export default function MyListingsPage() {
  redirect('/dashboard?page=marketplace')
}
