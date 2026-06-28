type Props = {
  children?: React.ReactNode
  theme?: 'alpine' | 'equatorial' | 'laboratory'
}

const themeClasses: Record<NonNullable<Props['theme']>, string> = {
  alpine:
    'bg-[radial-gradient(circle_at_20%_18%,rgba(198,165,90,0.18),transparent_28%),linear-gradient(145deg,#081423,#05070A)]',
  equatorial:
    'bg-[radial-gradient(circle_at_80%_20%,rgba(198,165,90,0.16),transparent_32%),linear-gradient(145deg,#05070A,#0F1B14)]',
  laboratory:
    'bg-[radial-gradient(circle_at_50%_0%,rgba(245,241,232,0.08),transparent_24%),linear-gradient(145deg,#05070A,#101826)]',
}

const noiseTexture = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' fill='none'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.55'/></svg>")`

export function CinematicThemeFrame({ children, theme = 'alpine' }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 ${themeClasses[theme]}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{ backgroundImage: noiseTexture }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_70%_70%,rgba(198,165,90,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(to_bottom,transparent,rgba(5,7,10,0.72))]" />
      <div className="relative">{children}</div>
    </div>
  )
}