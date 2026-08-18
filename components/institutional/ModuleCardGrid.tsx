import Link from 'next/link'
import type { ModuleItem } from '@/lib/institutional/content'
import { HarbourviewCard, hvPanelEyebrowClass } from '@/components/ui/HarbourviewPanel'

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
    <section id={id} className="border-b border-[color:var(--hv-gold)]/10 bg-[color:var(--hv-black)] py-14 sm:py-18 lg:py-20">
      <div className="page-container">
        <div className="max-w-3xl">
          <h2 className="font-serif text-3xl tracking-[-0.04em] text-[color:var(--hv-ivory)] sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-8 text-[color:var(--hv-text-secondary)]">{description}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const content = (
              <>
                {item.eyebrow ? (
                  <p className={`${hvPanelEyebrowClass} mb-3 tracking-[0.24em]`}>
                    {item.eyebrow}
                  </p>
                ) : null}
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-[color:var(--hv-gold)] to-[color:var(--hv-gold-light)]" />
                <h3 className="text-lg font-semibold text-[color:var(--hv-ivory)]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--hv-text-secondary)]">{item.description}</p>
                {item.href ? (
                  <span className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--hv-gold)]">
                    Explore
                  </span>
                ) : null}
              </>
            )

            return item.href ? (
              <Link key={item.title} href={item.href} className="block transition-colors hover:opacity-95">
                <HarbourviewCard tone="public" as="div" className="h-full p-7 hover:border-[color:var(--hv-gold)]/24">
                  {content}
                </HarbourviewCard>
              </Link>
            ) : (
              <HarbourviewCard key={item.title} tone="public" as="div" className="p-7">
                {content}
              </HarbourviewCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
