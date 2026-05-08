type PolishProps = {
  children: React.ReactNode
  className?: string
}

export function WeightedHoverSurface({ children, className = '' }: PolishProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-[0_18px_70px_rgba(0,0,0,0.32)] transition-[transform,border-color,box-shadow] duration-700 ease-out hover:-translate-y-1 hover:border-[#C6A55A]/45 hover:shadow-[0_28px_95px_rgba(198,165,90,0.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 motion-reduce:transition-none bg-[radial-gradient(circle_at_35%_0%,rgba(198,165,90,0.16),transparent_35%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}

export function GlassReflectionLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute -left-1/2 top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 blur-sm transition-all duration-[1400ms] ease-out group-hover:left-[115%] group-hover:opacity-100 motion-reduce:hidden" />
    </div>
  )
}

export function SoftReveal({ children, className = '' }: PolishProps) {
  return (
    <div className={`animate-[fadeIn_900ms_ease-out_both] motion-reduce:animate-none ${className}`}>
      {children}
    </div>
  )
}

export function DepthTypography({ children, className = '' }: PolishProps) {
  return (
    <div className={`text-shadow-sm [text-wrap:balance] ${className}`}>
      {children}
    </div>
  )
}
