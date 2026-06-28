type Props = {
  children?: React.ReactNode
  variant?: 'hero' | 'panel' | 'release'
}

export function AtmosphericFrame({ children, variant = 'panel' }: Props) {
  return (
    <div className={`relative overflow-hidden ${variant === 'hero' ? 'rounded-none' : 'rounded-[2rem]'}`}>
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(198,165,90,0.14),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(245,241,232,0.05),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute -inset-10 bg-[conic-gradient(from_210deg_at_50%_50%,transparent,rgba(198,165,90,0.08),transparent,rgba(245,241,232,0.04),transparent)] animate-[spin_38s_linear_infinite] motion-reduce:animate-none" />
      <div className="relative">{children}</div>
    </div>
  )
}
