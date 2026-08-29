import { redirect } from 'next/navigation'
// Dead code cleanup: this route already redirects via ACTIVE_COMMAND_CENTRE_REDIRECTS
// in config/command-centre-routes.mjs (mode: 'redirect-now'), wired into next.config.mjs's
// redirects(). This page.tsx was unreachable but never removed.
export default function Page() { redirect('/dashboard?page=marketplace&section=marketplace&marketView=wanted&tool=wanted-intake') }
