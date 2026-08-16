'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// Routes that suppress the public marketing shell (nav + footer).
// /dashboard: operator dashboard
// /country: Command Centre segment-based jurisdiction routes
// /organization: authenticated organization onboarding and management workflows
const NO_SHELL_PREFIXES = ['/dashboard', '/country', '/organization']

// Routes where neither nav nor footer renders — page provides its own chrome.
const NO_CHROME_ROUTES = ['/']

export function ShellWrapper({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const isNoShell = NO_SHELL_PREFIXES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isNoChrome = NO_CHROME_ROUTES.includes(pathname)

  if (isNoShell || isNoChrome) {
    return <>{children}</>
  }

  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
