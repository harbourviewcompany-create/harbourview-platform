import { redirect } from 'next/navigation'
// Dead code cleanup: this route already redirects via ACTIVE_COMMAND_CENTRE_REDIRECTS
// in config/command-centre-routes.mjs (mode: 'redirect-now'), wired into next.config.mjs's
// redirects(). This page.tsx was unreachable but never removed. FinancingInquiryForm (the
// sibling component this page used to render) is left untouched -- it's imported directly by
// components/dashboard/mobile-command/WorkspacePanels.tsx and stays live.
export default function Page() { redirect('/dashboard?page=trade-calc&section=financing&tool=financing-intake') }
