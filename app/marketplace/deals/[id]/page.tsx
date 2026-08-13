import { redirect } from 'next/navigation'

/** Superseded 2026-08-03 — see app/marketplace/deals/page.tsx. */
export default function DealRoomPage() {
  redirect('/dashboard?page=marketplace')
}
