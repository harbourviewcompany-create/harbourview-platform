'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ADMIN_NAV_GROUPS, type AdminNavItem } from '@/lib/admin/navConfig'

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavItem({ item, pathname, onNavigate }: { item: AdminNavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActivePath(pathname, item.href)
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition',
        active
          ? 'bg-[#C6A55A]/12 text-[#E2C776] ring-1 ring-inset ring-[#C6A55A]/25'
          : 'text-[#F5F1E8]/62 hover:bg-white/[0.05] hover:text-[#F5F1E8]',
        item.status === 'in_progress' ? 'border border-dashed border-white/10' : '',
      ].join(' ')}
    >
      <span className="min-w-0 truncate">{item.label}</span>
      {item.status === 'in_progress' ? (
        <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-[#F5F1E8]/35">WIP</span>
      ) : null}
    </Link>
  )
}

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin navigation" className="space-y-5">
      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[#F5F1E8]/32">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      ))}
    </nav>
  )
}

export default function AdminShell({
  children,
  actorLabel,
  actorRoles,
}: {
  children: React.ReactNode
  actorLabel: string
  actorRoles: string[]
}) {
  const pathname = usePathname() || '/admin'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const legacyHub = pathname === '/admin/hub'

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const sectionLabel = useMemo(() => {
    for (const group of ADMIN_NAV_GROUPS) {
      const exact = group.items.find((item) => isActivePath(pathname, item.href))
      if (exact) return exact.label
    }
    return 'Admin'
  }, [pathname])

  // Preserve the legacy Hub exactly during the parity period. HubPanel owns a
  // fixed full-screen shell and must remain directly comparable until retirement.
  // This return intentionally comes after all hooks so route transitions never
  // change hook ordering.
  if (legacyHub) return <>{children}</>

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#081423] text-[#F5F1E8]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/8 bg-[#06101E] lg:flex">
        <div className="border-b border-white/8 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C6A55A]">Harbourview</p>
          <p className="mt-1 text-xs text-[#F5F1E8]/38">Admin Command Center</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <AdminNav pathname={pathname} />
        </div>
        <div className="border-t border-white/8 px-4 py-4">
          <p className="truncate text-xs font-medium text-[#F5F1E8]/72">{actorLabel}</p>
          <p className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-[#F5F1E8]/32">
            {actorRoles.join(' · ')}
          </p>
          <form action="/admin/logout" method="post" className="mt-3">
            <button className="text-xs text-[#F5F1E8]/48 transition hover:text-[#F5F1E8]" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header
          className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-white/8 bg-[#06101E]/95 px-3 backdrop-blur lg:px-6"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#F5F1E8]/75 lg:hidden"
            aria-label="Open admin navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{sectionLabel}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[#F5F1E8]/32 lg:hidden">Admin Command Center</p>
          </div>
          <Link
            href="/admin/work"
            className="hidden min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-[#F5F1E8]/60 transition hover:bg-white/[0.04] hover:text-[#F5F1E8] sm:inline-flex"
          >
            <Search className="size-3.5" aria-hidden="true" />
            Work queue
          </Link>
        </header>

        <main className="min-w-0 overflow-x-hidden px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">{children}</div>
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/65"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(88vw,340px)] max-w-full flex-col border-r border-white/10 bg-[#06101E] shadow-2xl"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="flex min-h-14 items-center justify-between border-b border-white/8 px-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C6A55A]">Harbourview</p>
                <p className="mt-0.5 text-[10px] text-[#F5F1E8]/38">Admin Command Center</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 text-[#F5F1E8]/70"
                aria-label="Close admin navigation"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <AdminNav pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-white/8 px-4 py-4">
              <p className="truncate text-xs text-[#F5F1E8]/70">{actorLabel}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#F5F1E8]/32">{actorRoles.join(' · ')}</p>
              <form action="/admin/logout" method="post" className="mt-3">
                <button className="min-h-10 text-xs text-[#F5F1E8]/55" type="submit">Sign out</button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
