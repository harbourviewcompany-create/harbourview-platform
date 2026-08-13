import { redirect } from 'next/navigation'

/**
 * Superseded 2026-08-03: SignalSemanticSearch now renders natively inside
 * Command Centre's Signals section (desktop: toggle button in SignalsPage;
 * mobile: 'search' SignalSub tab). Updated 2026-08-12: this route is no
 * longer an orphan — mobile's cross-command SearchSection explicitly links
 * here for full-corpus search ("Session scope only — does not query the
 * full reviewed corpus. Search full corpus \u2192"). The redirect passes
 * both search=1 (desktop: opens SignalsPage's search toggle via
 * openSignalsSearch prop) and section=search (mobile: useMobileCommandModel
 * reads ?section= directly, overriding the page->section mapping that would
 * otherwise land on 'weekly-signals' instead of 'search').
 */
export default function SignalSearchPage() {
  redirect('/dashboard?page=signals&search=1&section=search')
}
