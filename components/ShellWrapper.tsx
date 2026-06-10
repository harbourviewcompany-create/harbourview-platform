'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const DASHBOARD_ROUTE_PREFIXES = ['/dashboard']
const COMMAND_CENTRE_ROUTE_PREFIXES = ['/country']
const NO_CHROME_ROUTES = ['/']

function matchesRoutePrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = matchesRoutePrefix(pathname, DASHBOARD_ROUTE_PREFIXES)
  const isCommandCentre = matchesRoutePrefix(pathname, COMMAND_CENTRE_ROUTE_PREFIXES)
  const isNoChrome = NO_CHROME_ROUTES.includes(pathname)

  if (isDashboard || isCommandCentre || isNoChrome) {
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
