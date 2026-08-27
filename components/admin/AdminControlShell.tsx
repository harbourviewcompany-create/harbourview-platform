'use client'

/**
 * Admin Control Surface shell — single sidebar chrome for all /admin/(protected) routes.
 */
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CONTROL_SURFACE_NAV,
  matchControlNav,
  type ControlNavItem,
} from '@/lib/admin/controlSurfaceNav'
import { mkApi } from '@/components/admin/panels/shared'

type BadgeKey = NonNullable<ControlNavItem['badgeKey']>
type BadgeCounts = Partial<Record<BadgeKey, number>>

const shellCss = `
  .acs-root{display:grid;grid-template-columns:220px 1fr;min-height:100vh;background:#080E1C;color:#D4C9B8;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;}
  .acs-sidebar{background:#060C1A;border-right:1px solid #1A2640;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
  .acs-logo{padding:20px 18px 14px;border-bottom:1px solid #1A2640;}
  .acs-logo-mark{font-size:11px;font-weight:600;letter-spacing:.25em;color:#C9A84C;text-transform:uppercase;}
  .acs-logo-sub{font-size:10px;color:#4A5E80;margin-top:4px;}
  .acs-nav{flex:1;overflow-y:auto;padding:10px 8px 20px;}
  .acs-nav-group{font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#3A4E6A;padding:14px 10px 6px;}
  .acs-nav-item{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:8px 10px;border-radius:6px;border:none;background:transparent;color:#8A9BB5;font-size:12.5px;text-decoration:none;cursor:pointer;margin-bottom:2px;}
  .acs-nav-item:hover{background:#0D1527;color:#D4C9B8;}
  .acs-nav-item.active{background:#142033;color:#C9A84C;}
  .acs-nav-icon{width:14px;text-align:center;flex-shrink:0;font-size:12px;}
  .acs-badge{margin-left:auto;background:#8B2020;color:#FFB3B3;font-size:10px;padding:1px 6px;border-radius:10px;min-width:18px;text-align:center;}
  .acs-badge.warn{background:#7A5A10;color:#FFD980;}
  .acs-main{min-width:0;display:flex;flex-direction:column;min-height:100vh;}
  .acs-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #1A2640;background:#080E1C;position:sticky;top:0;z-index:10;}
  .acs-title{font-size:15px;font-weight:500;color:#E8DFD0;}
  .acs-content{flex:1;padding:16px 20px 32px;min-width:0;}
  .acs-status{padding:10px 14px;border-top:1px solid #1A2640;font-size:10px;color:#3A4E6A;font-family:ui-monospace,monospace;}
  .acs-status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;margin-right:6px;}
  @media (max-width:900px){
    .acs-root{grid-template-columns:1fr;}
    .acs-sidebar{position:relative;height:auto;max-height:none;border-right:none;border-bottom:1px solid #1A2640;}
    .acs-nav{display:flex;flex-wrap:wrap;gap:4px;padding:8px;max-height:none;overflow:visible;}
    .acs-nav-group{width:100%;padding:8px 6px 2px;}
    .acs-nav-item{width:auto;padding:6px 10px;font-size:12px;}
  }
`

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  const activeId = useMemo(() => matchControlNav(pathname, search), [pathname, search])
  const title =
    CONTROL_SURFACE_NAV.flatMap((g) => g.items).find((i) => i.id === activeId)?.label || 'Admin'

  const [badges, setBadges] = useState<BadgeCounts>({})

  useEffect(() => {
    let cancelled = false
    const client = mkApi()
    ;(async () => {
      try {
        const [sigs, staging, inqs] = await Promise.all([
          client.get('signals', 'select=id,reviewed&reviewed=is.false&limit=500').catch(() => []),
          client.get('hv_import_staging', 'select=id,status&limit=500').catch(() => []),
          client.get('marketplace_inquiries', 'select=id,review_status&limit=200').catch(() => []),
        ])
        if (cancelled) return
        const arr = (value: unknown) => (Array.isArray(value) ? value : [])
        const pendingStage = arr(staging).filter(
          (s) => !s.status || s.status === 'pending' || s.status === 'queued',
        ).length
        const pendingInq = arr(inqs).filter(
          (i) => !i.review_status || i.review_status === 'pending',
        ).length
        setBadges({
          unreviewed_signals: arr(sigs).length,
          staging_pending: pendingStage,
          inquiry_pending: pendingInq,
        })
      } catch {
        /* badges are optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname])

  return (
    <>
      <style>{shellCss}</style>
      <div className="acs-root">
        <aside className="acs-sidebar">
          <div className="acs-logo">
            <div className="acs-logo-mark">Harbourview</div>
            <div className="acs-logo-sub">Admin Control Surface</div>
          </div>
          <nav className="acs-nav">
            {CONTROL_SURFACE_NAV.map((group) => (
              <div key={group.label}>
                <div className="acs-nav-group">{group.label}</div>
                {group.items.map((item) => {
                  const active = item.id === activeId
                  const count = item.badgeKey ? badges[item.badgeKey] || 0 : 0
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`acs-nav-item${active ? ' active' : ''}`}
                    >
                      <span className="acs-nav-icon">{item.icon}</span>
                      {item.label}
                      {count > 0 ? (
                        <span className={`acs-badge${count > 50 ? '' : ' warn'}`}>{count > 99 ? '99+' : count}</span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className="acs-status">
            <span className="acs-status-dot" />
            control surface
          </div>
        </aside>
        <div className="acs-main">
          <div className="acs-topbar">
            <span className="acs-title">{title}</span>
            <Link href="/admin/hub" style={{ fontSize: 11, color: '#4A5E80', textDecoration: 'none' }}>
              Overview
            </Link>
          </div>
          <div className="acs-content">{children}</div>
        </div>
      </div>
    </>
  )
}

export function AdminControlShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#080E1C', color: '#6A7E9B', padding: 24 }}>
          Loading admin…
        </div>
      }
    >
      <ShellInner>{children}</ShellInner>
    </Suspense>
  )
}
