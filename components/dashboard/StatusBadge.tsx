interface Props {
  label: string
  className?: string
}

export function StatusBadge({ label, className }: Props) {
  const l = label.toLowerCase()

  let color = 'border-white/10 text-white/50 bg-white/[0.03]'
  if (l.includes('recreational') || l.includes('adult-use') || l.includes('legal')) {
    color = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.07]'
  } else if (l.includes('active') || l.includes('open')) {
    color = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.07]'
  } else if (l.includes('medical')) {
    color = 'border-sky-500/30 text-sky-400 bg-sky-500/[0.07]'
  } else if (l.includes('emerging') || l.includes('developing') || l.includes('pilot')) {
    color = 'border-amber-500/30 text-amber-400 bg-amber-500/[0.07]'
  } else if (l.includes('decrim')) {
    color = 'border-amber-500/30 text-amber-400 bg-amber-500/[0.07]'
  } else if (l.includes('restricted') || l.includes('illegal')) {
    color = 'border-red-500/30 text-red-400 bg-red-500/[0.07]'
  }

  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-[0.1em] uppercase whitespace-nowrap'
  const classes = [base, color, className].filter(Boolean).join(' ')

  return <span className={classes}>{label}</span>
}
