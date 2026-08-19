'use client'

import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import Link from 'next/link'

type Mode = 'cannabis' | 'service'

const inputClass = 'mt-1.5 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2.5 text-sm text-[#F5F1E8] placeholder:text-[#F5F1E8]/25 outline-none transition focus:border-[#C6A55A]'
const MAX_FILES = 6

function Field({ label, name, required, placeholder, type = 'text' }: { label: string; name: string; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm text-[#F5F1E8]/70">
      {label}{required ? <span className="ml-1 text-red-400">*</span> : null}
      <input name={name} type={type} required={required} placeholder={placeholder} className={inputClass} />
    </label>
  )
}

function Area({ label, name, required, placeholder, rows = 3 }: { label: string; name: string; required?: boolean; placeholder?: string; rows?: number }) {
  return (
    <label className="block text-sm text-[#F5F1E8]/70">
      {label}{required ? <span className="ml-1 text-red-400">*</span> : null}
      <textarea name={name} rows={rows} required={required} placeholder={placeholder} className={inputClass} />
    </label>
  )
}

function Select({ label, name, options, required }: { label: string; name: string; options: string[]; required?: boolean }) {
  return (
    <label className="block text-sm text-[#F5F1E8]/70">
      {label}{required ? <span className="ml-1 text-red-400">*</span> : null}
      <select name={name} required={required} className={inputClass} defaultValue="">
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

export function TradingSupplyIntakeForm({ mode }: { mode: Mode }) {
  const [status, setStatus] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [documents, setDocuments] = useState<File[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  function handleFiles(event: ChangeEvent<HTMLInputElement>, setter: (files: File[]) => void) {
    setter(Array.from(event.target.files ?? []).slice(0, MAX_FILES))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setStatus('Submitting…')
    const data = new FormData(event.currentTarget)
    if (mode === 'cannabis') {
      data.set('category_key', 'cannabis_inventory')
      data.set('listing_type_key', 'cannabis_inventory')
      data.set('listing_type', 'Cannabis Inventory')
    } else {
      data.set('category_key', 'services')
      data.set('listing_type_key', 'service')
      data.set('listing_type', 'Service')
    }
    images.forEach((file) => data.append('images', file))
    documents.forEach((file) => data.append('documents', file))

    try {
      const response = await fetch('/api/marketplace/submit', { method: 'POST', body: data })
      const body = await response.json().catch(() => ({})) as { error?: string; message?: string }
      if (!response.ok) {
        setStatus(body.error ?? 'Submission failed.')
        return
      }
      setSuccess(true)
      setStatus(body.message ?? 'Submission received for Harbourview review.')
      formRef.current?.reset()
      setImages([])
      setDocuments([])
    } catch {
      setStatus('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F]/90 p-8 text-center shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C6A55A]">Received</p>
        <h2 className="mt-3 text-2xl font-semibold text-[#F5F1E8]">Trading submission is in review.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#F5F1E8]/55">{status}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => { setSuccess(false); setStatus(null) }} className="rounded-full bg-[#C6A55A] px-5 py-2.5 text-sm font-semibold text-[#061322]">Submit another</button>
          <Link href="/marketplace/trading" className="rounded-full border border-[#C6A55A]/30 px-5 py-2.5 text-sm text-[#F5F1E8]/70">View trading board</Link>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-7 rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F]/90 p-5 shadow-2xl shadow-black/30 sm:p-8">
      <input name="hp_field" className="hidden" tabIndex={-1} autoComplete="off" />

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C6A55A]">Commercial identity</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={mode === 'cannabis' ? 'Lot / product title' : 'Service title'} name="title" required placeholder={mode === 'cannabis' ? 'e.g. CBD flower — White Widow' : 'e.g. CO₂ extraction service'} />
          <Field label="Country" name="country" required placeholder="e.g. Canada, Germany, Portugal" />
          {mode === 'cannabis' ? (
            <>
              <Select label="Inventory form" name="inventory_form" required options={['Flower','Isolate','Distillate','Seeds','Biomass','Hash / pollen / resin','Oil','Trim','Terpenes','Pre-rolls','Vape / cartridge','Other']} />
              <Field label="Lot / trade reference" name="trade_reference" placeholder="Internal or commercial lot reference" />
            </>
          ) : (
            <>
              <Select label="Service category" name="service_category" required options={['Extraction','THC remediation / washdown','Infusion','Enrichment','Distillation / isolation','Lab testing','Manufacturing','White label / private label','Packaging','Other']} />
              <Field label="Service location" name="stock_location" placeholder="Facility city / country" />
            </>
          )}
        </div>
        <div className="mt-4">
          <Area label="Commercial description" name="message" required rows={5} placeholder="Describe the product or service, differentiators, constraints and buyer-relevant operating details." />
        </div>
      </section>

      {mode === 'cannabis' ? (
        <>
          <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">Stock & logistics</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Available quantity" name="stock_quantity" required placeholder="e.g. 150 kg, 10 tonnes, 50,000 units" />
              <Field label="Stock location" name="stock_location" required placeholder="Country / warehouse region" />
              <Field label="Origin / production country" name="origin_country" placeholder="Where product was grown or manufactured" />
              <Field label="Cultivation / production method" name="cultivation_method" placeholder="Indoor, greenhouse, outdoor, extraction method…" />
              <Field label="Harvest / production date" name="harvest_date" placeholder="YYYY-MM or descriptive batch date" />
              <Field label="Minimum order quantity" name="minimum_order_quantity" placeholder="e.g. 1 kg" />
              <Field label="Packaging" name="packaging" placeholder="Bulk bag, drum, 1 kg pouch, retail-ready…" />
              <Field label="Incoterms" name="incoterms" placeholder="EXW, FCA, DAP, other / negotiable" />
            </div>
            <div className="mt-4"><Area label="Shipping territories" name="shipping_territories" required placeholder="Countries or regions where supply can be shipped, subject to lawful buyer qualification." /></div>
          </section>

          <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">Analytical profile</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="CBD %" name="cbd_percent" placeholder="e.g. 12.4" />
              <Field label="CBDA %" name="cbda_percent" />
              <Field label="THC %" name="thc_percent" />
              <Field label="Δ9-THC %" name="delta9_thc_percent" />
              <Field label="THCA %" name="thca_percent" />
              <Field label="CBG %" name="cbg_percent" />
              <Field label="CBN %" name="cbn_percent" />
              <Field label="CBC %" name="cbc_percent" />
              <Field label="CBDV / other %" name="other_cannabinoids" />
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">Service operating profile</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Capacity" name="service_capacity" required placeholder="e.g. 200 kg/day" />
            <Field label="Turnaround" name="turnaround_time" placeholder="e.g. 2 business days" />
            <Field label="Minimum batch" name="minimum_batch" placeholder="e.g. 2 kg" />
            <Field label="Fee model" name="fee_model" placeholder="Per kg, per batch, project fee…" />
          </div>
          <div className="mt-4 grid gap-4">
            <Area label="Process / method" name="process" required placeholder="Processing method, inputs, outputs, material handling and relevant constraints." />
            <Area label="Jurisdictions served" name="jurisdictions_served" required placeholder="Countries / markets served and any qualification requirements." />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">Pricing, availability & evidence</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Headline price / range" name="price_or_budget" placeholder="e.g. €350/kg from 1 kg" />
          <Select label="Availability" name="availability_status" options={['Available now','Future supply','Limited availability','Partially allocated','On request','Paused']} />
          <Select label="Market activity" name="activity_status" options={['New listing','Previously traded — still available','Offers active','Under negotiation','Partially allocated']} />
          <Field label="Certifications / standards" name="certifications" placeholder="GACP, EU-GMP, organic, ISO, other" />
        </div>
        <div className="mt-4 grid gap-4">
          <Area label="Volume pricing tiers" name="price_tiers_raw" rows={5} placeholder={'One tier per line, e.g.\n1 kg | EUR 350/kg\n10 kg | EUR 300/kg\n50 kg | EUR 250/kg'} />
          <Area label="Existing document / COA links" name="public_document_links" placeholder="One HTTPS URL per line. Harbourview will review before any public document is exposed." />
          {mode === 'service' ? <Area label="Proof / facility / certification links" name="proof_links" placeholder="One HTTPS URL per line." /> : null}
        </div>
        {mode === 'cannabis' ? (
          <label className="mt-4 flex items-center gap-3 text-sm text-[#F5F1E8]/70">
            <input type="checkbox" name="sample_available" value="yes" className="h-4 w-4" /> Sample can be provided to a qualified buyer
          </label>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">Files</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-[#F5F1E8]/70">
            Product / facility images
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => handleFiles(event, setImages)} className="mt-2 block w-full text-xs text-[#F5F1E8]/45" />
            <span className="mt-1 block text-xs text-[#F5F1E8]/35">Up to {MAX_FILES} files selected: {images.length}</span>
          </label>
          <label className="block text-sm text-[#F5F1E8]/70">
            COAs / certificates / commercial documents
            <input type="file" accept="application/pdf,text/csv" multiple onChange={(event) => handleFiles(event, setDocuments)} className="mt-2 block w-full text-xs text-[#F5F1E8]/45" />
            <span className="mt-1 block text-xs text-[#F5F1E8]/35">Private at intake; publication requires review. Selected: {documents.length}</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Authority to submit" name="authority_to_submit" required options={['Owner / seller','Authorized broker','Employee / operator','Service provider','Other / needs review']} />
          <label className="flex items-center gap-3 self-end pb-2 text-sm text-[#F5F1E8]/70">
            <input type="checkbox" name="accepts_harbourview_routing" value="yes" required className="h-4 w-4" /> Open to Harbourview-routed buyer introductions
          </label>
        </div>
      </section>

      {status ? <p className="rounded-xl border border-[#C6A55A]/15 bg-[#061322] p-3 text-sm text-[#F5F1E8]/60">{status}</p> : null}
      <button type="submit" disabled={busy} className="w-full rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#061322] transition hover:bg-[#D8BD75] disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit for Harbourview review'}
      </button>
    </form>
  )
}
