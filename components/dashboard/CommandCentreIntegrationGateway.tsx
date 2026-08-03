'use client'

import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import FinancingInquiryForm from '@/app/marketplace/financing/FinancingInquiryForm'
import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'
import { MySubmissionsPanel } from '@/components/dashboard/MySubmissionsPanel'
import type CommandCentre from '@/components/dashboard/CommandCentre'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import { ALL_COUNTRIES } from '@/lib/countries'
import { createClient } from '@/lib/supabase/client'
import {
  COMMAND_CENTRE_MODULES,
  buildCommandCentreModuleHref,
  getCommandCentreModule,
  normalizeCommandCentreModule,
  type CommandCentreModule,
} from '@/lib/dashboard/commandCentreIntegration'

type DashboardProps = React.ComponentProps<typeof CommandCentre>
type MarketplaceAction = 'sell' | 'intake' | 'my-listings'

type GatewayProps = {
  isMobile: boolean
  dashboardProps: DashboardProps
  children: React.ReactNode
}

type PersonalBriefingPayload = {
  personal: { narrative: string; source: string; marketsCovered: string[] }
  activeRules: Array<{ id: string; rule_type: string; keywords: string[] }>
  synthBriefings: Array<{
    iso2: string
    briefing: {
      week_ending: string
      headline: string
      summary: string
      operator_implications?: string | null
      signal_count: number
    }
  }>
}

type TalentJob = {
  id: string
  title: string
  department: string | null
  location: string | null
  operator_name: string | null
  operator_verification_status: string | null
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function text(value: unknown, keys: string[], fallback: string): string {
  const item = record(value)
  for (const key of keys) {
    const found = item[key]
    if (typeof found === 'string' && found.trim()) return found.trim()
    if (typeof found === 'number') return String(found)
  }
  return fallback
}

function countryLabel(iso2?: string | null): string {
  return ALL_COUNTRIES.find(country => country.iso2 === iso2)?.displayName ?? 'Global'
}

function normalizeMarketplaceAction(value: string | null): MarketplaceAction | null {
  return value === 'sell' || value === 'intake' || value === 'my-listings' ? value : null
}

function marketplaceActionTitle(action: MarketplaceAction): string {
  if (action === 'my-listings') return 'My Submissions'
  if (action === 'intake') return 'Marketplace Intake'
  return 'Submit Listing'
}

function ModuleNavigation({
  active,
  context,
  mode,
}: {
  active: CommandCentreModule
  context: { country?: string | null; role?: string | null }
  mode: 'desktop' | 'mobile' | 'inline'
}) {
  return (
    <nav className={`ccig-nav ccig-nav--${mode}`} aria-label="Command Centre modules">
      {COMMAND_CENTRE_MODULES.map(module => (
        <a
          key={module.id}
          href={buildCommandCentreModuleHref(module.id, context)}
          className={active === module.id ? 'active' : ''}
          aria-current={active === module.id ? 'page' : undefined}
        >
          <span aria-hidden="true">{module.icon}</span>
          <em>{module.label}</em>
        </a>
      ))}
    </nav>
  )
}

function ModuleLauncher({
  active,
  context,
  isMobile,
}: {
  active: CommandCentreModule
  context: { country?: string | null; role?: string | null }
  isMobile: boolean
}) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    let focusFrame = 0

    if (open && !dialog.open) {
      dialog.showModal()
      focusFrame = window.requestAnimationFrame(() => {
        dialog.querySelector<HTMLButtonElement>('[data-launcher-close]')?.focus()
      })
    } else if (!open && dialog.open) {
      dialog.close()
    }

    return () => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame)
    }
  }, [open])

  const closeLauncher = () => setOpen(false)

  return (
    <div className={`ccig-launcher ${isMobile ? 'mobile' : 'desktop'}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="command-centre-module-launcher"
      >
        <span aria-hidden="true">⌘</span> Modules
      </button>
      <dialog
        ref={dialogRef}
        id="command-centre-module-launcher"
        className={`ccig-launcher-panel ${isMobile ? 'mobile' : 'desktop'}`}
        aria-label="Command Centre module launcher"
        onCancel={(event) => {
          event.preventDefault()
          closeLauncher()
        }}
        onClose={() => {
          setOpen(false)
          triggerRef.current?.focus()
        }}
      >
        <div className="ccig-launcher-head">
          <strong>Command Centre</strong>
          <button data-launcher-close type="button" onClick={closeLauncher} aria-label="Close module launcher">×</button>
        </div>
        <ModuleNavigation active={active} context={context} mode={isMobile ? 'mobile' : 'desktop'} />
      </dialog>
    </div>
  )
}

function ModuleSurface({
  module,
  action,
  title,
  isMobile,
  country,
  role,
  children,
}: {
  module: CommandCentreModule
  action?: MarketplaceAction | null
  title?: string
  isMobile: boolean
  country: string
  role: string
  children: React.ReactNode
}) {
  const definition = getCommandCentreModule(module)
  const context = { country, role }
  return (
    <section
      className={`ccig-portal ${isMobile ? 'mobile' : 'desktop'}`}
      data-command-centre-module={module}
      data-command-centre-action={action ?? undefined}
      data-command-centre-shell={isMobile ? 'mobile' : 'desktop'}
    >
      <header className="ccig-inline-header">
        <div>
          <span>{countryLabel(country)} · {role || 'All Roles'}</span>
          <h1>{title ?? definition.label}</h1>
        </div>
        <a href={buildCommandCentreModuleHref('briefing', context)}>Briefing</a>
      </header>
      <ModuleNavigation active={module} context={context} mode="inline" />
      <div className="ccig-main">{children}</div>
    </section>
  )
}

function Section({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="ccig-page">
      <header>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  )
}

function MarketModule({ props }: { props: DashboardProps }) {
  const metrics = props.marketMetrics ?? []
  const flows = props.tradeFlows ?? []
  const hasMarketData = metrics.length > 0 || flows.length > 0
  return (
    <Section eyebrow="Market Intelligence" title="Market" description="Country-context market metrics, trade flows and operating indicators.">
      <div className="ccig-grid">
        {!hasMarketData && <div className="ccig-empty">No market metrics or trade flows match the current context.</div>}
        {metrics.map((metric, index) => (
          <article className="ccig-card" key={`metric-${index}`}>
            <span>{text(metric, ['category', 'metric_type', 'label'], 'Market metric')}</span>
            <h3>{text(metric, ['metric_name', 'name', 'title'], 'Market indicator')}</h3>
            <p>{text(metric, ['display_value', 'value', 'summary'], 'Value pending')}</p>
          </article>
        ))}
        {flows.map((flow, index) => (
          <article className="ccig-card" key={`flow-${index}`}>
            <span>{text(flow, ['origin', 'source_country'], 'Trade')} → {text(flow, ['destination', 'destination_country'], 'Market')}</span>
            <h3>{text(flow, ['product', 'product_type', 'title'], 'Trade flow')}</h3>
            <p>{text(flow, ['summary', 'status', 'volume'], 'Reviewed corridor data')}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

function supplyRows(marketplaceRows: DashboardProps['marketplaceRows']) {
  const rows = marketplaceRows as Record<string, readonly (readonly unknown[])[]> | undefined
  return ['consumables', 'equipment', 'new-products', 'cannabis']
    .flatMap(section => (rows?.[section] ?? []).map((row, index) => ({
      id: String(row[7] ?? `${section}-${index}`),
      title: String(row[0] ?? 'Supply listing'),
      summary: String(row[1] ?? 'Reviewed supply opportunity'),
      jurisdiction: String(row[2] ?? 'Global'),
      category: String(row[3] ?? section),
      status: String(row[4] ?? 'Listed'),
    })))
}

function SupplyModule({ props }: { props: DashboardProps }) {
  const rows = useMemo(() => supplyRows(props.marketplaceRows), [props.marketplaceRows])
  return (
    <Section eyebrow="Trade & Commerce" title="Supply" description="Consumables, packaging, equipment and product supply in the active Command Centre context.">
      <div className="ccig-grid">
        {rows.length === 0 && <div className="ccig-empty">No supply records match the current context.</div>}
        {rows.map(row => (
          <article className="ccig-card" key={row.id}>
            <span>{row.category} · {row.jurisdiction}</span>
            <h3>{row.title}</h3>
            <p>{row.summary}</p>
            <em>{row.status}</em>
          </article>
        ))}
      </div>
    </Section>
  )
}

function FinancingModule({ props }: { props: DashboardProps }) {
  return (
    <Section eyebrow="Trade & Commerce" title="Trade Financing" description={`Structured financing inquiry for ${countryLabel(props.initialCountryIso2)} transactions.`}>
      <FinancingInquiryForm />
    </Section>
  )
}

function DirectoriesModule({ props }: { props: DashboardProps }) {
  const groups = [
    ['Professional', props.professionals ?? []],
    ['Service provider', props.serviceProviders ?? []],
    ['Licensed operator', props.cannabisOperators ?? []],
  ] as const
  const cards = groups.flatMap(([kind, items]) => items.map((item, index) => ({ kind, item, index })))
  return (
    <Section eyebrow="Network & Industry" title="Directories" description="Professionals, service providers and licensed operators in one Command Centre surface.">
      <div className="ccig-grid">
        {cards.length === 0 && <div className="ccig-empty">No directory records match the current context.</div>}
        {cards.slice(0, 80).map(({ kind, item, index }) => (
          <article className="ccig-card" key={`${kind}-${text(item, ['id', 'slug'], String(index))}`}>
            <span>{kind} · {text(item, ['jurisdiction_label', 'country_code', 'country_iso2'], 'Global')}</span>
            <h3>{text(item, ['displayName', 'display_name', 'operator_name', 'legal_name', 'name'], `${kind} record`)}</h3>
            <p>{text(item, ['service_summary', 'public_summary', 'description', 'summary'], 'Reviewed directory record')}</p>
            <em>{text(item, ['verification_level', 'verification_status', 'status'], 'Reviewed')}</em>
          </article>
        ))}
      </div>
    </Section>
  )
}

function PersonalBriefingsModule() {
  const [data, setData] = useState<PersonalBriefingPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/personal-briefings', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`)
        return body as PersonalBriefingPayload
      })
      .then(body => { if (!cancelled) setData(body) })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Briefings unavailable') })
    return () => { cancelled = true }
  }, [])
  return (
    <Section eyebrow="Intelligence · Personalized" title="My Briefings" description="Watch-rule-driven personal synthesis and reviewed market briefings.">
      {error && <div className="ccig-empty error">{error}</div>}
      {!error && !data && <div className="ccig-empty">Loading personalized briefings…</div>}
      {data && (
        <div className="ccig-stack">
          <article className="ccig-card featured">
            <span>Personal synthesis · {data.personal.source}</span>
            <h3>Current intelligence brief</h3>
            <p>{data.personal.narrative}</p>
          </article>
          <div className="ccig-grid">
            {data.synthBriefings.map(({ iso2, briefing }) => (
              <article className="ccig-card" key={`${iso2}-${briefing.week_ending}`}>
                <span>{iso2} · week {briefing.week_ending}</span>
                <h3>{briefing.headline}</h3>
                <p>{briefing.summary}</p>
                <em>{briefing.signal_count} signals</em>
              </article>
            ))}
            {data.activeRules.map(rule => (
              <article className="ccig-card" key={rule.id}>
                <span>Active watch rule</span>
                <h3>{rule.rule_type.replace(/_/g, ' ')}</h3>
                <p>{rule.keywords.join(' · ')}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

function SearchModule() {
  return (
    <Section eyebrow="Intelligence" title="Signal Search" description="Semantic and keyword search over the reviewed, quality-gated signal corpus.">
      <SignalSemanticSearch />
    </Section>
  )
}

function TalentModule() {
  const [jobs, setJobs] = useState<TalentJob[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let cancelled = false
    createClient()
      .from('talent_jobs_public')
      .select('id, title, department, location, operator_name, operator_verification_status')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) setError(true)
        else setJobs((data as TalentJob[] | null) ?? [])
      })
    return () => { cancelled = true }
  }, [])
  return (
    <Section eyebrow="Network & Industry" title="Talent" description="Open roles from operators and organizations in the Harbourview network.">
      {error && <div className="ccig-empty error">Talent roles could not be loaded.</div>}
      {!error && jobs === null && <div className="ccig-empty">Loading open roles…</div>}
      <div className="ccig-grid">
        {!error && jobs?.length === 0 && <div className="ccig-empty">No open roles match the current context.</div>}
        {jobs?.map(job => (
          <article className="ccig-card" key={job.id}>
            <span>{job.location ?? 'Location pending'} · {job.department ?? 'General'}</span>
            <h3>{job.title}</h3>
            <p>{job.operator_name ?? 'Harbourview network operator'}</p>
            {job.operator_verification_status === 'verified' && <em>Verified operator</em>}
          </article>
        ))}
      </div>
    </Section>
  )
}

function MarketplaceActionSurface({ action, searchParams }: { action: MarketplaceAction; searchParams: URLSearchParams }) {
  if (action === 'my-listings') {
    return (
      <Section eyebrow="Marketplace" title="My Submissions" description="Review the current status of your private marketplace submissions without leaving Command Centre.">
        <div className="ccig-action-row">
          <a href="/dashboard?page=marketplace&action=sell">+ New submission</a>
        </div>
        <div className="ccig-submissions"><MySubmissionsPanel /></div>
      </Section>
    )
  }

  const isIntake = action === 'intake'
  return (
    <Section
      eyebrow="Marketplace"
      title={isIntake ? 'Marketplace Intake' : 'Submit Listing'}
      description={isIntake
        ? 'Submit a controlled marketplace requirement, supply opportunity or commercial mandate from inside Command Centre.'
        : 'Submit supply, assets, services, wanted requests or commercial opportunities for Harbourview review.'}
    >
      <div className="ccig-action-note">
        Submissions remain private by default. Public visibility, seller exposure and buyer introductions are never automatic.
      </div>
      <DynamicMarketplaceIntakeForm
        defaultType={searchParams.get('type') ?? undefined}
        defaultHeadline={searchParams.get('headline') ?? ''}
        defaultMarkets={searchParams.get('markets') ?? ''}
      />
    </Section>
  )
}

function CustomModule({ module, props }: { module: CommandCentreModule; props: DashboardProps }) {
  switch (module) {
    case 'market': return <MarketModule props={props} />
    case 'supply': return <SupplyModule props={props} />
    case 'financing': return <FinancingModule props={props} />
    case 'directories': return <DirectoriesModule props={props} />
    case 'personal-briefings': return <PersonalBriefingsModule />
    case 'search': return <SearchModule />
    case 'talent': return <TalentModule />
    default: return null
  }
}

export default function CommandCentreIntegrationGateway({ isMobile, dashboardProps, children }: GatewayProps) {
  const searchParams = useSearchParams()
  const requestedModule = normalizeCommandCentreModule(searchParams.get('module'))
  const requestedAction = normalizeMarketplaceAction(searchParams.get('action'))
  const isCustomModule = Boolean(requestedModule && getCommandCentreModule(requestedModule).custom)
  const hasPortalSurface = isCustomModule || Boolean(requestedAction)
  const portalModule: CommandCentreModule | null = requestedAction ? 'marketplace' : requestedModule
  const fallbackModule = COMMAND_CENTRE_MODULES.find(module => !module.custom && module.page === dashboardProps.initialPage)?.id ?? 'briefing'
  const active = requestedAction ? 'marketplace' : requestedModule ?? fallbackModule
  const context = { country: dashboardProps.initialCountryIso2, role: dashboardProps.initialRoleId }
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasPortalSurface) {
      setPortalTarget(null)
      setPortalError(null)
      return
    }

    let cancelled = false
    let frame = 0
    let attempts = 0
    const selector = isMobile ? '.hvm-main' : '.cc-main'
    setPortalError(null)

    const attach = () => {
      if (cancelled) return
      const target = document.querySelector<HTMLElement>(selector)
      if (target) {
        setPortalTarget(target)
        return
      }
      attempts += 1
      if (attempts >= 180) {
        setPortalError(`Command Centre surface ${selector} could not be attached. Return to Briefing and retry.`)
        return
      }
      frame = window.requestAnimationFrame(attach)
    }

    frame = window.requestAnimationFrame(attach)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [hasPortalSurface, isMobile])

  useEffect(() => {
    if (!portalTarget || !portalModule || !hasPortalSurface) return

    const titleSelector = isMobile ? '.hvm-titlebar h1' : '.cc-page-title'
    const title = document.querySelector<HTMLElement>(titleSelector)
    const surfaceTitle = requestedAction ? marketplaceActionTitle(requestedAction) : getCommandCentreModule(portalModule).label

    portalTarget.dataset.ccigActive = requestedAction ?? portalModule
    title?.setAttribute('data-ccig-title', surfaceTitle)
    portalTarget.scrollTo({ top: 0, behavior: 'instant' })

    return () => {
      delete portalTarget.dataset.ccigActive
      title?.removeAttribute('data-ccig-title')
    }
  }, [portalTarget, portalModule, requestedAction, hasPortalSurface, isMobile])

  return (
    <>
      <style>{CSS}</style>
      {children}
      {portalModule && hasPortalSurface && portalTarget && createPortal(
        <ModuleSurface
          module={portalModule}
          action={requestedAction}
          title={requestedAction ? marketplaceActionTitle(requestedAction) : undefined}
          isMobile={isMobile}
          country={dashboardProps.initialCountryIso2 ?? 'GLOBAL'}
          role={dashboardProps.initialRoleId ?? ''}
        >
          {requestedAction
            ? <MarketplaceActionSurface action={requestedAction} searchParams={new URLSearchParams(searchParams.toString())} />
            : requestedModule
              ? <CustomModule module={requestedModule} props={dashboardProps} />
              : null}
        </ModuleSurface>,
        portalTarget,
      )}
      {portalError && <div className="ccig-portal-error" role="alert">{portalError}</div>}
      <ModuleLauncher active={active} context={context} isMobile={isMobile} />
    </>
  )
}

const CSS = `
.cc-main[data-ccig-active] > :not(.ccig-portal),.hvm-main[data-ccig-active] > :not(.ccig-portal){display:none!important}.cc-page-title[data-ccig-title],.hvm-titlebar h1[data-ccig-title]{font-size:0!important}.cc-page-title[data-ccig-title]::before,.hvm-titlebar h1[data-ccig-title]::before{content:attr(data-ccig-title);font-size:inherit}.cc-page-title[data-ccig-title]::before{font-size:15px}.hvm-titlebar h1[data-ccig-title]::before{font-size:clamp(28px,9vw,40px)}.cc-page-title[data-ccig-title] .cc-change-ctx{font-size:10px}.ccig-portal{width:100%;max-width:100%;min-width:0;color:#f5f0e8}.ccig-inline-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 0 18px;border-bottom:1px solid rgba(255,255,255,.08)}.ccig-inline-header span,.ccig-page>header span,.ccig-card>span{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(212,168,75,.78)}.ccig-inline-header h1{font-family:Georgia,serif;font-size:30px;font-weight:400;margin:3px 0 0}.ccig-inline-header>a{color:#d4a84b;text-decoration:none;border:1px solid rgba(212,168,75,.3);border-radius:999px;padding:9px 14px}.ccig-nav{background:transparent}.ccig-nav a{display:flex;align-items:center;gap:10px;color:rgba(245,240,232,.58);text-decoration:none;border-radius:10px}.ccig-nav a.active{background:rgba(212,168,75,.11);color:#d4a84b}.ccig-nav em{font-style:normal;font-size:12px}.ccig-nav--inline{display:flex;gap:6px;overflow-x:auto;padding:12px 0 4px;scrollbar-width:none}.ccig-nav--inline a{flex:0 0 auto;padding:8px 11px;border:1px solid rgba(255,255,255,.06)}.ccig-main{min-width:0;padding:18px 0 0;overflow:hidden}.ccig-page{max-width:1180px;margin:0 auto}.ccig-page>header{margin-bottom:20px}.ccig-page>header h2{font-family:Georgia,serif;font-size:clamp(30px,4vw,44px);font-weight:400;margin:7px 0}.ccig-page>header p,.ccig-card p{color:rgba(245,240,232,.58);line-height:1.65}.ccig-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:12px}.ccig-stack{display:grid;gap:14px}.ccig-card,.ccig-empty{min-width:0;padding:16px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(255,255,255,.035)}.ccig-card.featured{border-color:rgba(212,168,75,.27);background:rgba(212,168,75,.055)}.ccig-card h3{margin:8px 0;font-size:16px}.ccig-card p{font-size:13px;margin:7px 0 12px}.ccig-card em{display:inline-flex;font-style:normal;font-size:10px;color:#d4a84b;border:1px solid rgba(212,168,75,.25);border-radius:999px;padding:4px 8px}.ccig-empty{color:rgba(245,240,232,.55)}.ccig-empty.error{color:#e08080;border-color:rgba(224,80,80,.25)}.ccig-action-note{max-width:900px;margin:0 0 16px;padding:14px 16px;border:1px solid rgba(212,168,75,.18);border-radius:12px;background:rgba(212,168,75,.05);color:rgba(245,240,232,.62);font-size:13px;line-height:1.6}.ccig-action-row{display:flex;justify-content:flex-end;margin:-8px 0 12px}.ccig-action-row a{border-radius:999px;background:#d4a84b;color:#07111f;padding:9px 14px;text-decoration:none;font-size:12px;font-weight:700}.ccig-submissions{max-width:900px}.ccig-submissions .cc-right-section{border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(255,255,255,.035);padding:16px}.ccig-portal-error{position:fixed;right:18px;bottom:76px;z-index:121;max-width:min(420px,calc(100vw - 24px));padding:12px 14px;border:1px solid rgba(224,80,80,.35);border-radius:12px;background:#18111a;color:#f0b0b0;box-shadow:0 16px 44px rgba(0,0,0,.45)}.ccig-launcher{position:fixed;z-index:120}.ccig-launcher.desktop{right:18px;bottom:18px}.ccig-launcher.mobile{right:12px;bottom:92px}.ccig-launcher>button{border:1px solid rgba(212,168,75,.36);background:#101826;color:#d4a84b;border-radius:999px;padding:10px 15px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.35)}.ccig-launcher-panel{position:fixed;inset:auto 18px 68px auto;width:min(360px,calc(100vw - 24px));max-height:70dvh;overflow:auto;margin:0;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#07111f;color:#f5f0e8;box-shadow:0 24px 80px rgba(0,0,0,.55);padding:12px}.ccig-launcher-panel.mobile{inset:auto 12px 140px auto}.ccig-launcher-panel::backdrop{background:rgba(0,0,0,.38)}.ccig-launcher-head{display:flex;align-items:center;justify-content:space-between;padding:4px 6px 10px;color:#f5f0e8}.ccig-launcher-head button{border:0;background:transparent;color:#f5f0e8;font-size:22px}.ccig-launcher-panel .ccig-nav{display:grid;grid-template-columns:1fr 1fr;gap:5px}.ccig-launcher-panel .ccig-nav a{padding:10px}.ccig-page .fif-card{max-width:900px}.ccig-page>div[style]{max-width:none!important;margin:0!important;padding:0!important}@media(max-width:767px){.ccig-portal-error{right:12px;bottom:140px}.ccig-portal.mobile .ccig-inline-header{align-items:flex-start;padding-bottom:14px}.ccig-portal.mobile .ccig-inline-header h1{font-size:28px}.ccig-nav--inline{margin:0 -2px;padding-top:10px}.ccig-nav--inline a{padding:8px 10px}.ccig-main{padding-top:14px}.ccig-grid{grid-template-columns:minmax(0,1fr)}.ccig-launcher-panel .ccig-nav{grid-template-columns:1fr 1fr}.ccig-page .fif-card{padding:18px 14px}.ccig-action-row{justify-content:flex-start}}
`
