import Image from 'next/image'
import { CONSUMABLES_IMAGE_MANIFEST, type ConsumablesImageKey } from './image-manifest'

const productSlots: Array<{
  category: string
  meta: string
  title: string
  body: string
  image: ConsumablesImageKey
  specs: Array<[string, string]>
}> = [
  {
    category: 'Cones',
    meta: 'MOQ pending',
    title: 'King-size pre-roll cones',
    body: 'Neutral premium card for unbleached or white cones, bulk cartons and quote-based production runs.',
    image: 'preRollConesKingSize',
    specs: [
      ['Formats', '84 / 98 / 109 mm'],
      ['Use case', 'Pre-roll production'],
      ['Status', 'Supplier quote'],
    ],
  },
  {
    category: 'Pouches',
    meta: 'Custom print',
    title: 'Matte child-resistant pouches',
    body: 'Stand-up pouch slot for finished goods, sample packs, custom branding and future compliance variants.',
    image: 'matteChildResistantPouches',
    specs: [
      ['Finish', 'Matte / soft-touch'],
      ['Options', 'Window / no window'],
      ['Status', 'Image required'],
    ],
  },
  {
    category: 'Jars',
    meta: 'Premium',
    title: 'Premium glass jars',
    body: 'High-end jar card for flower packaging, display-ready formats, liners and matched closures.',
    image: 'premiumGlassJars',
    specs: [
      ['Materials', 'Glass / PET'],
      ['Closures', 'CR / threaded'],
      ['Status', 'Quote-ready'],
    ],
  },
  {
    category: 'Labels',
    meta: 'Roll stock',
    title: 'Roll labels and tamper seals',
    body: 'Label and seal slot for batch runs, compliance panels, tamper indicators and SKU families.',
    image: 'rollLabelsTamperSeals',
    specs: [
      ['Formats', 'Roll / sheet'],
      ['Finish', 'Matte / gloss'],
      ['Status', 'Proof required'],
    ],
  },
  {
    category: 'Boxes',
    meta: 'Retail',
    title: 'Custom retail cartons',
    body: 'Premium carton slot for display packaging, multipacks, inserts and controlled brand presentation.',
    image: 'customRetailCartons',
    specs: [
      ['Formats', 'Carton / sleeve'],
      ['Options', 'Foil / emboss'],
      ['Status', 'Design needed'],
    ],
  },
  {
    category: 'Jars',
    meta: 'Opaque',
    title: 'Opaque flower jars',
    body: 'Controlled packaging slot for opaque black, white or amber jars with matched closures and liners.',
    image: 'opaqueFlowerJars',
    specs: [
      ['Sizes', '2g / 3.5g / 7g'],
      ['Closure', 'CR cap'],
      ['Status', 'Supplier quote'],
    ],
  },
]

function AssetFrame({ imageKey }: { imageKey: ConsumablesImageKey }) {
  const asset = CONSUMABLES_IMAGE_MANIFEST[imageKey]

  return (
    <figure className="overflow-hidden rounded-sm border border-gold/10 bg-[#071425]">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(198,165,90,0.16),transparent_34%),linear-gradient(135deg,rgba(2,8,20,1),rgba(10,22,38,1))]">
        {asset.status === 'ready' ? (
          <Image
            src={asset.path}
            alt={asset.alt}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-90 saturate-[0.88] transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-28 w-40 items-center justify-center rounded-sm border border-gold/20 bg-[#020814]/80 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/70">
            Asset slot
          </div>
        )}
      </div>
      <figcaption className="border-t border-gold/10 px-4 py-3 text-[11px] leading-5 text-white/40">
        {asset.alt}
      </figcaption>
    </figure>
  )
}

export function ConsumablesProductSlots() {
  return (
    <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-16" id="products">
      <div className="page-container">
        <div className="mb-8 sm:mb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/70">
            Product slots
          </p>
          <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
            Consumables catalogue scaffold.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
            These product slots preserve the standalone page structure while keeping final supplier information, availability and pricing out of public view until approved.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productSlots.map((slot) => (
            <article
              key={`${slot.category}-${slot.title}`}
              className="group flex flex-col overflow-hidden rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30"
            >
              <AssetFrame imageKey={slot.image} />
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  <span>{slot.category}</span>
                  <span>{slot.meta}</span>
                </div>
                <h3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]">{slot.title}</h3>
                <p className="flex-1 text-sm leading-7 text-white/60">{slot.body}</p>
                <dl className="mt-5 grid grid-cols-1 gap-2 text-xs text-white/50">
                  {slot.specs.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-t border-white/10 pt-2">
                      <dt>{label}</dt>
                      <dd className="text-right font-semibold text-white/70">{value}</dd>
                    </div>
                  ))}
                </dl>
                <a href="#request" className="btn-marketplace mt-6 justify-center text-center text-sm">
                  Request quote
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ConsumablesAssetManifestPanel() {
  const assets = Object.values(CONSUMABLES_IMAGE_MANIFEST)

  return (
    <section className="border-t border-gold/10 bg-[#030b16] py-12 sm:py-16" id="assets">
      <div className="page-container">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/70">
            Image manifest
          </p>
          <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
            Explicit asset slots for consumables.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/60">
            Final WebP product images can be added without changing card logic. Placeholder frames keep the page reviewable until those files are present.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {assets.map((asset) => (
            <div key={asset.key} className="rounded-sm border border-gold/10 bg-[#071425] p-5">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="break-all text-xs font-semibold text-[#f5f1e8]">{asset.path}</p>
                <span className="w-fit rounded-full border border-gold/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/75">
                  {asset.status === 'ready' ? 'Ready' : 'Needed'}
                </span>
              </div>
              <p className="text-xs leading-6 text-white/50">{asset.generationPrompt}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
