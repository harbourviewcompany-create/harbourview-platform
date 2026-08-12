import { redirect } from 'next/navigation'

/**
 * Superseded 2026-08-03: personal briefing synthesis now renders as the
 * "My Briefings" tab inside Command Centre's Briefing section
 * (components/dashboard/MyBriefingsPanel.tsx, fetched lazily via
 * GET /api/dashboard/my-briefings — the underlying watch-rule + LLM
 * synthesis logic was extracted from this file, unchanged).
 */
export default function MyBriefingsPage() {
  redirect('/dashboard?page=briefing')
}
