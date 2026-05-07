type Props = {
  mood: string
  label?: string
}

export function EditorialImagePlaceholder({ mood, label }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#C6A55A]/20 bg-[#081423]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(198,165,90,0.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.05),transparent_30%),linear-gradient(145deg,#05070A,#0B1A2F)]" />
      <div className="relative flex aspect-[4/5] items-end p-6">
        <div>
          {label ? (
            <div className="mb-3 inline-flex rounded-full border border-[#C6A55A]/35 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#C6A55A]">
              {label}
            </div>
          ) : null}
          <div className="max-w-xs text-sm leading-6 text-[#F5F1E8]/72">
            {mood}
          </div>
        </div>
      </div>
    </div>
  )
}
