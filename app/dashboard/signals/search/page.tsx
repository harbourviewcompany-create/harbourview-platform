import { redirect } from 'next/navigation'

/**
 * Superseded 2026-08-03: this route was a self-described orphan — its own
 * top comment noted "does not modify any existing page or navigation" and
 * no link to it was ever added anywhere. SignalSemanticSearch now renders
 * natively inside Command Centre's Signals section (desktop: toggle button
 * in SignalsPage; mobile: 'search' SignalSub tab — already wired there).
 */
export default function SignalSearchPage() {
  redirect('/dashboard?page=signals')
}
