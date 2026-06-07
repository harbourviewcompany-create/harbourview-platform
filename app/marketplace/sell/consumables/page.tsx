import type { Metadata } from 'next'
import { ConsumablesSupplierForm } from '@/components/marketplace/ConsumablesSupplierForm'

export const metadata: Metadata = {
  title: 'Submit Consumables Supply | Harbourview',
  description:
    'Submit packaging, lab consumables, cultivation inputs and operating supplies for licensed cannabis operators. Harbourview reviews all supply before routing.',
}

export default function SellConsumablesPage() {
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">

        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C6A55A]/60">
          Harbourview / Marketplace / Submit Supply
        </p>

        <h1 className="mb-3 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
          Submit consumables supply.
        </h1>
        <p className="mb-10 text-base leading-8 text-white/55">
          Packaging, lab consumables, cultivation inputs, extraction supplies and operating materials
          for licensed cannabis facilities. All supply is reviewed by Harbourview before any public
          listing or buyer introduction.
        </p>

        {/* What we accept */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Packaging',
              body: 'CR pouches, glass jars, pre-roll cones, exit bags, labels, humidity packs.',
            },
            {
              title: 'Lab & extraction',
              body: 'Solvents, reagents, filter media, reference standards, QA consumables.',
            },
            {
              title: 'Facility inputs',
              body: 'Nutrients, substrates, PPE, sanitation, maintenance and cultivation supplies.',
            },
          ].map(item => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">
                {item.title}
              </p>
              <p className="text-sm leading-6 text-white/55">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Review notice */}
        <div className="mb-8 rounded-2xl border border-[#C6A55A]/20 bg-[#C6A55A]/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">
            Controlled review process
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Harbourview reviews category fit, authority, documentation and commercial relevance
            before any public listing is created or buyer introduction is made. Contact details
            are never shared without your explicit consent.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1A2F] p-6 md:p-8">
          <ConsumablesSupplierForm />
        </div>
      </div>
    </main>
  )
}
