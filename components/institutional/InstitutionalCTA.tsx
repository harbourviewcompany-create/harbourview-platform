import Link from 'next/link'

type InstitutionalCTAProps = {
  title: string
  body: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

export default function InstitutionalCTA({
  title,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: InstitutionalCTAProps) {
  return (
    <section className="bg-[#020814] py-14 sm:py-18">
      <div className="page-container">
        <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(3,11,22,0.98)_100%)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-10">
          <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
            {body}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={primaryHref} className="btn-marketplace justify-center px-6 py-3 text-sm">
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref ? (
              <Link href={secondaryHref} className="btn-intelligence justify-center px-6 py-3 text-sm">
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
