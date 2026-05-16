import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type Tone = 'deep' | 'panel' | 'editorial' | 'form' | 'muted'
type ActionVariant = 'primary' | 'secondary' | 'quiet'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const surfaceTone: Record<Tone, string> = {
  deep: 'bg-[#020812] text-white',
  panel: 'border border-gold/15 bg-white/[0.035] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]',
  editorial: 'border border-[#d7caa9]/45 bg-[#f8f3e8] text-[#061527]',
  form: 'border border-[#d7caa9]/55 bg-[#fbf7ed] text-[#061527]',
  muted: 'border border-white/10 bg-white/[0.055] text-white',
}

const actionVariant: Record<ActionVariant, string> = {
  primary:
    'border border-gold bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#061527] shadow-[0_14px_38px_rgba(199,166,92,0.16)] transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold',
  secondary:
    'border border-gold/45 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold transition hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold',
  quiet:
    'border border-white/12 bg-white/[0.035] px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/72 transition hover:border-gold/45 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold',
}

export function Surface({
  tone = 'panel',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return <div className={cn(surfaceTone[tone], className)}>{children}</div>
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string
  children: ReactNode
  variant?: ActionVariant
  className?: string
}) {
  return (
    <Link href={href} className={cn('inline-flex items-center justify-center rounded-full', actionVariant[variant], className)}>
      {children}
    </Link>
  )
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: ActionVariant }) {
  return (
    <button {...props} className={cn('inline-flex items-center justify-center rounded-full', actionVariant[variant], className)}>
      {children}
    </button>
  )
}

export function SectionFrame({
  id,
  tone = 'deep',
  className,
  children,
}: {
  id?: string
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={cn(surfaceTone[tone], 'relative overflow-hidden py-16 sm:py-20 lg:py-24', className)}>
      <div className="page-container relative z-10">{children}</div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-9 max-w-3xl', className)}>
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold/78">{eyebrow}</p> : null}
      <h2 className="mt-3 font-serif text-3xl leading-[1.08] tracking-[-0.03em] text-inherit sm:text-4xl">{title}</h2>
      {children ? <div className="mt-4 space-y-3 text-sm leading-7 text-current/65 sm:text-base">{children}</div> : null}
    </div>
  )
}

export function PageHero({
  eyebrow,
  title,
  children,
  primary,
  secondary,
  tertiary,
  aside,
  compact = false,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
  tertiary?: { label: string; href: string }
  aside?: ReactNode
  compact?: boolean
}) {
  return (
    <section className={cn('relative overflow-hidden bg-[#020812] text-white', compact ? 'py-14 sm:py-16' : 'py-20 sm:py-24 lg:py-28')}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(199,166,92,0.16),transparent_34%),radial-gradient(circle_at_80%_12%,rgba(29,78,121,0.22),transparent_42%)]" />
      <div className="page-container relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-gold/82">{eyebrow}</p>
          <h1 className="mt-5 font-serif text-4xl leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <div className="mt-6 max-w-2xl space-y-4 text-base leading-8 text-white/68 sm:text-lg">{children}</div>
          {(primary || secondary || tertiary) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {primary ? <ButtonLink href={primary.href}>{primary.label}</ButtonLink> : null}
              {secondary ? <ButtonLink href={secondary.href} variant="secondary">{secondary.label}</ButtonLink> : null}
              {tertiary ? <ButtonLink href={tertiary.href} variant="quiet">{tertiary.label}</ButtonLink> : null}
            </div>
          ) : null}
        </div>
        {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
      </div>
    </section>
  )
}

export function TrustBoundaryPanel({ className }: { className?: string }) {
  const rows = [
    ['Public summary', 'Public pages show controlled summaries, categories, status language and request paths.'],
    ['Reviewed privately', 'Counterparties, documents, source material, route evidence and commercial terms remain inside reviewed workflows.'],
    ['Routed by fit', 'Harbourview reviews seriousness, jurisdictional fit and route compatibility before any introduction or publication step.'],
  ]

  return (
    <Surface tone="panel" className={cn('rounded-[2rem] p-6 sm:p-7', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold/78">Control model</p>
      <div className="mt-5 divide-y divide-white/10">
        {rows.map(([label, body]) => (
          <div key={label} className="grid gap-2 py-4 sm:grid-cols-[0.45fr_1fr]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/74">{label}</p>
            <p className="text-sm leading-7 text-white/58">{body}</p>
          </div>
        ))}
      </div>
    </Surface>
  )
}

export function AccessLaneCard({
  eyebrow,
  title,
  children,
  href,
  cta = 'Open pathway',
}: {
  eyebrow: string
  title: string
  children: ReactNode
  href: string
  cta?: string
}) {
  return (
    <Link href={href} className="group block rounded-[1.75rem] border border-gold/14 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-gold/45 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/74">{eyebrow}</p>
      <h3 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.03em] text-white">{title}</h3>
      <div className="mt-4 text-sm leading-7 text-white/58">{children}</div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-gold transition group-hover:text-gold-light">{cta} →</p>
    </Link>
  )
}

export function DemandBriefCard({
  title,
  jurisdiction,
  timing,
  budget,
  tags,
  href,
}: {
  title: string
  jurisdiction: string
  timing: string
  budget?: string
  tags: string[]
  href: string
}) {
  return (
    <article className="rounded-[1.75rem] border border-gold/15 bg-[#061527] p-6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-gold/76">Demand brief</p>
      <h3 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.03em]">{title}</h3>
      <dl className="mt-6 grid gap-4 border-y border-white/10 py-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.24em] text-white/38">Market</dt>
          <dd className="mt-1 text-white/74">{jurisdiction}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.24em] text-white/38">Timing</dt>
          <dd className="mt-1 text-white/74">{timing}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.24em] text-white/38">Budget</dt>
          <dd className="mt-1 text-white/74">{budget || 'Private review'}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/54">
            {tag}
          </span>
        ))}
      </div>
      <ButtonLink href={href} variant="secondary" className="mt-6 w-full">Respond through review</ButtonLink>
    </article>
  )
}

export function IntelligenceSignalCard({
  eyebrow,
  title,
  children,
  meta,
  href,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  meta: string
  href?: string
}) {
  const card = (
    <article className="h-full rounded-[1.75rem] border border-gold/15 bg-white/[0.035] p-6 text-white transition hover:border-gold/38 hover:bg-white/[0.055]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/74">{eyebrow}</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">{meta}</p>
      </div>
      <h3 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.03em] text-white">{title}</h3>
      <div className="mt-4 text-sm leading-7 text-white/58">{children}</div>
      {href ? <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-gold">Request review →</p> : null}
    </article>
  )

  return href ? <Link href={href} className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">{card}</Link> : card
}

export function FormSection({
  eyebrow,
  title,
  children,
  note,
}: {
  eyebrow?: string
  title: string
  children: ReactNode
  note?: ReactNode
}) {
  return (
    <Surface tone="form" className="rounded-[1.75rem] p-6 sm:p-7">
      {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8f7130]">{eyebrow}</p> : null}
      <h2 className="mt-2 font-serif text-2xl leading-tight tracking-[-0.03em] text-[#061527]">{title}</h2>
      {note ? <div className="mt-3 text-sm leading-7 text-[#435066]">{note}</div> : null}
      <div className="mt-6 space-y-5">{children}</div>
    </Surface>
  )
}

export function Field({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: ComponentPropsWithoutRef<'input'> & {
  label: string
  hint?: string
  error?: string
}) {
  const describedBy = [hint ? `${props.id}-hint` : null, error ? `${props.id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={props.id} className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#273348]">
        {label} {required ? <span className="text-[#9f2f2f]">*</span> : null}
      </label>
      {hint ? <p id={`${props.id}-hint`} className="mt-1 text-xs leading-5 text-[#647086]">{hint}</p> : null}
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-2 w-full rounded-xl border border-[#d8ceb7] bg-white px-4 py-3 text-sm text-[#061527] outline-none transition placeholder:text-[#8b94a3] focus:border-[#a9873c] focus:ring-2 focus:ring-[#c7a65c]/24"
      />
      {error ? <p id={`${props.id}-error`} className="mt-2 text-xs font-medium text-[#9f2f2f]">{error}</p> : null}
    </div>
  )
}

export function TextareaField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: ComponentPropsWithoutRef<'textarea'> & {
  label: string
  hint?: string
  error?: string
}) {
  const describedBy = [hint ? `${props.id}-hint` : null, error ? `${props.id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={props.id} className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#273348]">
        {label} {required ? <span className="text-[#9f2f2f]">*</span> : null}
      </label>
      {hint ? <p id={`${props.id}-hint`} className="mt-1 text-xs leading-5 text-[#647086]">{hint}</p> : null}
      <textarea
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-2 w-full rounded-xl border border-[#d8ceb7] bg-white px-4 py-3 text-sm text-[#061527] outline-none transition placeholder:text-[#8b94a3] focus:border-[#a9873c] focus:ring-2 focus:ring-[#c7a65c]/24"
      />
      {error ? <p id={`${props.id}-error`} className="mt-2 text-xs font-medium text-[#9f2f2f]">{error}</p> : null}
    </div>
  )
}

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'select'> & {
  label: string
  hint?: string
  error?: string
}) {
  const describedBy = [hint ? `${props.id}-hint` : null, error ? `${props.id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={props.id} className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#273348]">
        {label} {required ? <span className="text-[#9f2f2f]">*</span> : null}
      </label>
      {hint ? <p id={`${props.id}-hint`} className="mt-1 text-xs leading-5 text-[#647086]">{hint}</p> : null}
      <select
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-2 w-full rounded-xl border border-[#d8ceb7] bg-white px-4 py-3 text-sm text-[#061527] outline-none transition focus:border-[#a9873c] focus:ring-2 focus:ring-[#c7a65c]/24"
      >
        {children}
      </select>
      {error ? <p id={`${props.id}-error`} className="mt-2 text-xs font-medium text-[#9f2f2f]">{error}</p> : null}
    </div>
  )
}

export function FormErrorSummary({ errors }: { errors: Record<string, string> }) {
  const values = Object.values(errors)
  if (values.length === 0) return null

  return (
    <div role="alert" className="rounded-2xl border border-[#9f2f2f]/30 bg-[#fff4f0] px-4 py-3 text-sm text-[#7f2626]">
      <p className="font-semibold">Review the highlighted fields before submitting.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {values.map((error) => <li key={error}>{error}</li>)}
      </ul>
    </div>
  )
}
