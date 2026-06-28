type TypographyProps = {
  children?: React.ReactNode
  profile?: 'alpine' | 'equatorial' | 'laboratory'
}

const typographyThemes: Record<string, string> = {
  alpine: 'tracking-[-0.03em] leading-[0.95] text-[#F5F1E8]',
  equatorial: 'tracking-[-0.02em] leading-[0.92] text-[#D9C28B]',
  laboratory: 'tracking-[-0.01em] leading-[1] text-[#E8ECEF]',
}

export function EditorialTypography({ children, profile = 'alpine' }: TypographyProps) {
  return (
    <div className={`font-semibold ${typographyThemes[profile]}`}>
      {children}
    </div>
  )
}

export function SeasonalReleasePanel({
  season,
  description,
}: {
  season: string
  description: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/60 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_10%,rgba(198,165,90,0.45),transparent_35%)]" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.34em] text-[#C6A55A]">
          Seasonal release architecture
        </div>
        <div className="mt-5 text-3xl font-semibold text-[#F5F1E8]">{season}</div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#F5F1E8]/65">
          {description}
        </p>
      </div>
    </div>
  )
}

export function CuratorFeatureModule({
  title,
  note,
}: {
  title: string
  note: string
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/30 p-7 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Curator selection
      </div>
      <div className="mt-5 text-2xl font-semibold text-[#F5F1E8]">{title}</div>
      <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/65">{note}</p>
    </div>
  )
}

export function EditorialIntelligenceOverlay({
  insight,
}: {
  insight: string
}) {
  return (
    <div className="rounded-[2rem] border border-[#C6A55A]/20 bg-[linear-gradient(145deg,rgba(198,165,90,0.08),rgba(5,7,10,0.92))] p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Harbourview editorial intelligence
      </div>
      <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">{insight}</p>
    </div>
  )
}
