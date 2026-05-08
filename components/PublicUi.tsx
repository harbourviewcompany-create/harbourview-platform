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

export function FormShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-sm border border-gold/10 bg-[#071425] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-7', className)}>{children}</div>
}
