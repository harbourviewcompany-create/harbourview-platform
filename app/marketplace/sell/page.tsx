import { redirect } from 'next/navigation'
// Dead code cleanup: this route already redirects via ACTIVE_COMMAND_CENTRE_REDIRECTS
// in config/command-centre-routes.mjs (mode: 'redirect-now'), wired into next.config.mjs's
// redirects(). This page.tsx was unreachable but never removed. This redirect() call is
// belt-and-suspenders only -- the real redirect happens at the Next.js config layer before
// this file ever executes.
export default function Page() { redirect('/dashboard?page=marketplace&section=supply&marketView=cannabis&tool=supply-intake') }
