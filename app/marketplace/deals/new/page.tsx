import { redirect } from 'next/navigation'

/**
 * Superseded 2026-08-03 — see app/marketplace/deals/page.tsx. Creation now
 * happens via POST /api/marketplace/deal-rooms/create, called from
 * ListingDetailModal's "Open deal room" button without leaving the shell.
 * This stub only covers stale external links (none found in-repo).
 */
export default function NewDealRoomPage() {
  redirect('/dashboard?page=marketplace')
}
