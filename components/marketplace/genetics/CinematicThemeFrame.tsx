type Props = {
  children: React.ReactNode
  theme?: 'alpine' | 'equatorial' | 'laboratory'
}

const themeClasses: Record<string, string> = {
  alpine:
    'bg-[radial-gradient(circle_at_20%_18%,rgba(198,165,90,0.18),transparent_28%),linear-gradient(145deg,#081423,#05070A)]',
  equatorial:
    'bg-[radial-gradient(circle_at_80%_20%,rgba(198,165,90,0.16),transparent_32%),linear-gradient(145deg,#05070A,#0F1B14)]',
  laboratory:
    'bg-[radial-gradient(circle_at_50%_0%,rgba(245,241,232,0.08),transparent_24%),linear-gradient(145deg,#05070A,#101826)]',
}

const noiseTextureClass =
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22 fill=%22none%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.55%22/></svg>')]"

export function CinematicThemeFrame({ children, theme = 'alpine' }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 ${themeClasses[theme]}`}>
      <div className={`pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay ${noiseTextureClass}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_70%_70%,rgba(198,165,90,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(to_bottom,transparent,rgba(5,7,10,0.72))]" />
      <div className="relative">{children}</div>
    </div>
  )
}
