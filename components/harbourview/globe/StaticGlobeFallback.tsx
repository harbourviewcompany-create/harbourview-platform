export default function StaticGlobeFallback() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-full border border-hv-gold/20 bg-hv-ocean-navy shadow-[0_0_80px_rgba(198,165,90,0.16)]"
      aria-label="Harbourview globe preview"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(246,224,160,0.18),transparent_24%),radial-gradient(circle_at_65%_45%,rgba(198,165,90,0.20),transparent_18%),radial-gradient(circle_at_50%_60%,rgba(6,15,24,0.74),transparent_62%)]" />
      <div className="absolute inset-[11%] rounded-full border border-hv-gold/15" />
      <div className="absolute left-[28%] top-[22%] h-[38%] w-[28%] rounded-[45%_55%_40%_60%] bg-hv-gold/80 shadow-[0_0_24px_rgba(198,165,90,0.24)]" />
      <div className="absolute right-[23%] top-[35%] h-[24%] w-[18%] rounded-[55%_35%_60%_40%] bg-hv-gold/70" />
      <div className="absolute left-[42%] bottom-[24%] h-[18%] w-[22%] rounded-[50%_30%_55%_45%] bg-hv-dark-gold/75" />
      <div className="absolute inset-0 rounded-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.14)_18%,transparent_34%,transparent_100%)]" />
      <div className="absolute inset-0 rounded-full shadow-[inset_-36px_-28px_70px_rgba(0,0,0,0.72),inset_18px_18px_44px_rgba(245,241,232,0.06)]" />
    </div>
  )
}
