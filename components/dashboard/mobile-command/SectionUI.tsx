import type React from 'react'
import type { SectionId, Tone } from './contracts'

export type SectionRef = (node: HTMLElement | null) => void

export function SectionShell({
  id,
  sectionRef,
  eyebrow,
  title,
  description,
  action,
  className = '',
  children,
}: {
  id: SectionId
  sectionRef: SectionRef
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} ref={sectionRef} className={`hvm2-section ${className}`.trim()}>
      <header className="hvm2-section-heading">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function Metric({ label, value, detail, tone = 'neutral', onOpen, actionLabel }: {
  label: string
  value: React.ReactNode
  detail: string
  tone?: Tone
  onOpen?: () => void
  actionLabel?: string
}) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      {onOpen ? <i aria-hidden="true">→</i> : null}
    </>
  )

  if (onOpen) {
    return (
      <button
        type="button"
        className={`hvm2-metric hvm2-metric-action hvm2-tone-${tone}`}
        onClick={onOpen}
        aria-label={actionLabel ?? `${label}: ${String(value)}`}
      >
        {content}
      </button>
    )
  }

  return <article className={`hvm2-metric hvm2-tone-${tone}`}>{content}</article>
}

export function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`hvm2-pill hvm2-pill-${tone}`}>{children}</span>
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="hvm2-empty">
      <span aria-hidden="true">◇</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}
