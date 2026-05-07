import Link from 'next/link'
import type { InstitutionalPageContent } from '@/lib/institutional/content'

type InstitutionalHeroProps = Pick<
  InstitutionalPageContent,
  'eyebrow' | 'title' | 'description' | 'primaryCta' | 'secondaryCta'
>

export default function InstitutionalHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: InstitutionalHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(198,165,90,0.18),transparent_30%),linear-gradient(180deg,rgba(2,8,20,0.18),rgba(2,8,20,0.92))]" />
      <div className="page-container relative py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/78">
            {eyebrow}
          </p>
          <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/66 sm:text-lg">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryCta.href} className="btn-marketplace justify-center px-6 py-3 text-sm">
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link href={secondaryCta.href} className="btn-intelligence justify-center px-6 py-3 text-sm">
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
