import Link from 'next/link'
import type { ReactNode } from 'react'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type PublicAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

export function PublicCta({ action, className }: { action: PublicAction; className?: string }) {
  return (
    <Link
      href={action.href}
      className={cx(
        action.variant === 'secondary' ? 'btn-intelligence' : 'btn-marketplace',
        'min-h-[56px] justify-center text-center',
        className
      )}
    >
      <span>{action.label}</span>
      <span aria-hidden="true" className="text-xl leading-none">→</span>
    </Link>
  )
}

export function PublicCtaGroup({ actions, className }: { actions: PublicAction[]; className?: string }) {
  if (actions.length === 0) return null
  return (
    <div className={cx('flex flex-col gap-3 sm:flex-row sm:flex-wrap', className)}>
      {actions.map((action) => <PublicCta key={`${action.href}-${action.label}`} action={action} />)}
    </div>
  )
}

export function PublicHero({
  eyebrow,
  title,
  children,
  actions = [],
  aside,
  compact = false,
}: {
  eyebrow: string
  title: ReactNode
  children: ReactNode
  actions?: PublicAction[]
  aside?: ReactNode
  compact?: boolean
}) {
  return (
    <section className={cx('relative overflow-hidden border-b border-gold/10 bg-[#061120] text-white', compact ? 'py-10 sm:py-12 lg:py-14' : 'py-14 sm:py-16 lg:py-20')}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(198,165,90,0.10),transparent_28%)]" />
      <div className="page-container relative z-10">
        <div className={cx('grid grid-cols-1 gap-8', Boolean(aside) && 'lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start')}>
          <div className="max-w-5xl">
            <p className="mb-4 text-[11px] font-semibold uppercase leading-6 tracking-[0.28em] text-gold/78">{eyebrow}</p>
            <h1 className="font-serif text-[2.65rem] leading-[1.01] tracking-[-0.05em] text-[#f5f1e8] sm:text-5xl lg:text-6xl">{title}</h1>
            <div className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">{children}</div>
            <PublicCtaGroup actions={actions} className="mt-9" />
          </div>
          {aside ? <div className="lg:pt-1">{aside}</div> : null}
        </div>
      </div>
    </section>
  )
}

export function PublicSection({
  id,
  children,
  tone = 'dark',
  className,
}: {
  id?: string
  children: ReactNode
  tone?: 'dark' | 'navy' | 'panel'
  className?: string
}) {
  return (
    <section id={id} className={cx('border-b border-gold/10 py-12 sm:py-16 lg:py-18', tone === 'dark' && 'bg-[#020814]', tone === 'navy' && 'bg-[#030b16]', tone === 'panel' && 'bg-[#030b16]', className)}>
      <div className="page-container">{children}</div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  children,
  action,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">{eyebrow}</p> : null}
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">{title}</h2>
        {children ? <div className="mt-4 text-sm leading-7 text-white/58 sm:text-base">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function PublicCard({ children, className, muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return <div className={cx('rounded-sm border border-gold/10 shadow-[0_18px_44px_rgba(0,0,0,0.24)]', muted ? 'bg-[#071425]' : 'bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)]', className)}>{children}</div>
}

export function PublicLinkCard({ href, eyebrow, title, children }: { href: string; eyebrow?: string; title: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626] sm:p-7">
      {eyebrow ? <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">{eyebrow}</p> : null}
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      <h3 className="mb-4 text-xl font-semibold text-[#f5f1e8]">{title}</h3>
      <div className="text-sm leading-7 text-white/58">{children}</div>
    </Link>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: PublicAction }) {
  return (
    <PublicCard muted className="px-6 py-14 text-center sm:px-10 sm:py-16">
      <h2 className="font-serif text-3xl tracking-[-0.03em] text-[#f5f1e8]">{title}</h2>
      {children ? <div className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/58">{children}</div> : null}
      {action ? <PublicCta action={action} className="mt-7 inline-flex w-full sm:w-auto" /> : null}
    </PublicCard>
  )
}

export function FormShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-sm border border-gold/10 bg-[#071425] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-7', className)}>{children}</div>
}

export function FooterCta({ eyebrow, title, children, actions }: { eyebrow: string; title: ReactNode; children?: ReactNode; actions: PublicAction[] }) {
  return (
    <PublicSection tone="dark" className="border-b-0">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">{eyebrow}</p>
          <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">{title}</h2>
          {children ? <div className="mt-4 text-sm leading-7 text-white/58 sm:text-base">{children}</div> : null}
        </div>
        <PublicCtaGroup actions={actions} className="w-full lg:w-auto" />
      </div>
    </PublicSection>
  )
}
