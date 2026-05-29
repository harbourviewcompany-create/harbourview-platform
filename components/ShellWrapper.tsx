'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const DASHBOARD_ROUTES = ['/dashboard']
const NO_CHROME_ROUTES = ['/']

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = DASHBOARD_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isNoChrome = NO_CHROME_ROUTES.includes(pathname)

  if (isDashboard || isNoChrome) {
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
