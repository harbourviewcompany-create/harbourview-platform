import { redirect } from 'next/navigation'

/**
 * Superseded 2026-08-03: a complete in-shell replacement
 * (components/dashboard/pages/DealRoomsPanel.tsx) already existed and was
 * already wired into MarketplacePage's 'deals' subView — it just had no
 * reachable entry point (the sidebar widget still linked here instead of
 * calling into it). Fixed the wiring rather than rebuilding: see
 * components/dashboard/DealRoomsPanel.tsx (sidebar widget, now uses
 * onOpenRoom callback) and CommandCentre.tsx MarketplacePage
 * (dealsInitialRoomId state).
 */
export default function DealRoomsPage() {
  redirect('/dashboard?page=marketplace')
}
