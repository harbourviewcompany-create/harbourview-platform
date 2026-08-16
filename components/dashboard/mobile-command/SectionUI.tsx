import type React from 'react'
import type { SectionId, Tone } from './contracts'
import { HarbourviewCard } from '@/components/ui/HarbourviewPanel'

export type SectionRef = (node: HTMLElement | null) => void

/**
 * Launch-quality section shell for every mobile Command section.
 * Layout chrome stays on hvm2-* CSS; surface language is shared via tokens.
 */
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

/**
 * Command card surface.
 * Use tone="bare" when pairing with hvm2-command-brief / hvm2-priority-card
 * so CSS owns padding/border and we avoid double chrome.
 */
export function CommandCard({
  children,
  className = '',
  tone = 'bare',
}: {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'priority' | 'bare'
}) {
  return (
    <HarbourviewCard tone={tone} className={className}>
      {children}
    </HarbourviewCard>
  )
}

export function Metric({ label, value, detail, tone = 'neutral' }: {
  label: string
  value: React.ReactNode
  detail: string
  tone?: Tone
}) {
  return (
    <article className={`hvm2-metric hvm2-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
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
