type Props = {
  prestigeSignal: string
  accessModel: string
  pathwaySummary: string
}

export function ProfilePrestigePlaque({ prestigeSignal, accessModel, pathwaySummary }: Props) {
  return (
    <div className="rounded-[2rem] border border-[#C6A55A]/30 bg-[linear-gradient(145deg,rgba(198,165,90,0.12),rgba(11,26,47,0.9))] p-6 shadow-[0_0_40px_rgba(198,165,90,0.08)]">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Curated genetics profile
      </div>

      <div className="mt-5 text-2xl font-semibold text-[#F5F1E8]">
        {prestigeSignal}
      </div>

      <div className="mt-6 inline-flex rounded-full border border-[#C6A55A]/30 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#C6A55A]">
        {accessModel}
      </div>

      <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
        {pathwaySummary}
      </p>
    </div>
  )
}
