'use client'

import { useMemo, useState } from 'react'
import { MARKETPLACE_LISTING_TYPE_OPTIONS, resolveMarketplaceListingTypeOption } from '@/lib/marketplace/listingTypeOptions'
import { getFieldsetsForListingType, type MarketplaceIntakeField } from '@/lib/marketplace/intakeFieldsets'
import type { MarketplaceListingTypeKey } from '@/lib/marketplace/marketplaceTypes'

const TYPE_KEY_BY_LABEL: Record<string, MarketplaceListingTypeKey> = {
  'New Product': 'new_product',
  'Used / Surplus Equipment': 'used_surplus_equipment',
  'Cannabis Inventory': 'cannabis_inventory',
  'Wanted Request': 'wanted_request',
  Service: 'service',
  'Business Opportunity': 'business_opportunity',
  'Featured Network Opportunity': 'featured_network_opportunity',
  Consumables: 'consumables',
  'Cultivation Equipment': 'cultivation_equipment',
  'Distressed Inventory': 'distressed_inventory',
  'Distressed Businesses': 'distressed_businesses',
  'Genetics Program': 'genetics_program',
  'Qualified Access Request': 'qualified_access_request',
}

function renderField(field: MarketplaceIntakeField) {
  const cls = 'mt-2 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]'
  if (field.type === 'textarea') return <label key={field.name} className="block text-sm text-[#F5F1E8]/75">{field.label}<textarea name={field.name} rows={3} className={cls} /></label>
  if (field.type === 'select') return <label key={field.name} className="block text-sm text-[#F5F1E8]/75">{field.label}<select name={field.name} className={cls}><option value="">Select</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></label>
  if (field.type === 'checkbox') return <label key={field.name} className="flex items-center gap-3 rounded-xl border border-[#C6A55A]/10 bg-[#061322]/60 px-3 py-3 text-sm text-[#F5F1E8]/75"><input name={field.name} type="checkbox" className="h-4 w-4" />{field.label}</label>
  return <label key={field.name} className="block text-sm text-[#F5F1E8]/75">{field.label}<input name={field.name} placeholder={field.placeholder} className={cls} /></label>
}

export function DynamicMarketplaceIntakeForm({ defaultType }: { defaultType?: string }) {
  const resolvedDefault = resolveMarketplaceListingTypeOption(defaultType) ?? 'Used / Surplus Equipment'
  const [listingType, setListingType] = useState(resolvedDefault)
  const typeKey = TYPE_KEY_BY_LABEL[listingType] ?? 'used_surplus_equipment'
  const fieldsets = useMemo(() => getFieldsetsForListingType(typeKey), [typeKey])
  const inputCls = 'mt-2 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]'

  return (
    <form action="/api/marketplace/capture" method="post" className="space-y-8 rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F]/90 p-6 shadow-2xl shadow-black/30">
      <input type="hidden" name="inquiry_type" value={typeKey === 'wanted_request' ? 'wanted_request_submission' : 'listing_submission'} />
      <input type="text" name="hp_field" className="hidden" tabIndex={-1} autoComplete="off" />
      <div><p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Private marketplace intake</p><h2 className="mt-2 text-2xl font-semibold text-[#F5F1E8]">Submit supply, assets, services, or wanted demand</h2><p className="mt-3 text-sm leading-6 text-[#F5F1E8]/65">Submissions enter Harbourview operator review first. They do not publish automatically and private details stay off public pages.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-[#F5F1E8]/75">Contact name<input name="contact_name" required className={inputCls} /></label>
        <label className="block text-sm text-[#F5F1E8]/75">Business email<input name="contact_email" type="email" required className={inputCls} /></label>
        <label className="block text-sm text-[#F5F1E8]/75">Company<input name="contact_company" className={inputCls} /></label>
        <label className="block text-sm text-[#F5F1E8]/75">Phone<input name="contact_phone" className={inputCls} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm text-[#F5F1E8]/75">Listing type<select name="listing_type" value={listingType} onChange={(event) => setListingType(event.target.value)} className={inputCls}>{MARKETPLACE_LISTING_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><label className="block text-sm text-[#F5F1E8]/75">Price / budget / range<input name="price_or_budget" className={inputCls} /></label></div>
      <label className="block text-sm text-[#F5F1E8]/75">Title<input name="title" required className={inputCls} /></label>
      <label className="block text-sm text-[#F5F1E8]/75">Description<textarea name="message" rows={5} required className={inputCls} /></label>
      {fieldsets.map((fieldset) => <section key={fieldset.key} className="space-y-4 rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-4"><h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">{fieldset.label}</h3><div className="grid gap-4 md:grid-cols-2">{fieldset.fields.map(renderField)}</div></section>)}
      <button type="submit" className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#061322] hover:bg-[#D8BD75]">Submit for Harbourview review</button>
    </form>
  )
}
