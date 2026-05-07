import Link from 'next/link'
import type { ModuleItem } from '@/lib/institutional/content'

type ModuleCardGridProps = {
  title: string
  description: string
  items: ModuleItem[]
  id?: string
}

export default function ModuleCardGrid({
  title,
  description,
  items,
  id,
}: ModuleCardGridProps) {
  return (
    <section id={id} className="border-b border-gold/10 bg-[#020814] py-14 sm:py-18 lg:py-20">
      <div className="page-container">
        <div className="max-w-3xl">
          <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-8 text-white/60">{description}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const content = (
              <>
                {item.eyebrow ? (
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/68">
                    {item.eyebrow}
                  </p>
                ) : null}
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                <h3 className="text-lg font-semibold text-[#f4f1eb]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">{item.description}</p>
                {item.href ? (
                  <span className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    Explore
                  </span>
                ) : null}
              </>
            )

            const classes =
              'rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)] transition-colors hover:border-gold/24'

            return item.href ? (
              <Link key={item.title} href={item.href} className={classes}>
                {content}
              </Link>
            ) : (
              <div key={item.title} className={classes}>
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
