import Link from 'next/link'
import type { PublicGeneticsProfileCard as PublicGeneticsProfileCardData } from '@/lib/marketplace/genetics/publicProjection'

export function GeneticsProfileCard({ profile }: { profile: PublicGeneticsProfileCardData }) {
  return (
    <Link
      href={`/marketplace/genetics/${profile.slug}`}
      className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.95)_0%,rgba(5,12,22,1)_100%)] p-7 transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626]"
    >
      <div className="mb-5 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-gold/70">
        <span>{profile.type}</span>
        <span className="text-white/40">{profile.region}</span>
      </div>

      <h3 className="mb-4 text-xl font-semibold text-[#f4f1eb]">{profile.name}</h3>
      <p className="text-sm leading-7 text-white/58">{profile.summary}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {profile.publicFocus.map((focus) => (
          <span key={focus} className="rounded-full border border-gold/10 px-3 py-1 text-xs text-white/56">
            {focus}
          </span>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-gold/85 transition-colors group-hover:text-gold-light">
          View Profile
        </span>
        <span className="text-xs text-white/40">
          {profile.currentDropCount} current drop{profile.currentDropCount === 1 ? '' : 's'}
        </span>
      </div>
    </Link>
  )
}
