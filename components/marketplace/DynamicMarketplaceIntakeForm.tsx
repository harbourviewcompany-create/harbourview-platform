'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  MARKETPLACE_LISTING_TYPE_OPTIONS,
  resolveMarketplaceListingTypeOption,
} from '@/lib/marketplace/listingTypeOptions'
import type { MarketplaceListingTypeOption } from '@/lib/marketplace/listingTypeOptions'
import {
  getFieldsetsForListingType,
  type MarketplaceIntakeField,
} from '@/lib/marketplace/intakeFieldsets'
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
  'Processing Equipment': 'processing_equipment',
  'Distressed Inventory': 'distressed_inventory',
  'Distressed Businesses': 'distressed_businesses',
  'Genetics Program': 'genetics_program',
  'Qualified Access Request': 'qualified_access_request',
  'Education Resource': 'education_resource',
  'Licensing Opportunity': 'licensing_opportunity',
  'Facility / Real Estate': 'real_estate_facility',
  'Technology & Software': 'technology_software',
  'Investment Opportunity': 'investment_opportunity',
  'Research Asset': 'research_asset',
}

const CATEGORY_KEY_BY_TYPE: Record<string, string> = {
  new_product: 'new_products',
  consumables: 'consumables',
  used_surplus_equipment: 'used_surplus',
  cultivation_equipment: 'cultivation_equipment',
  processing_equipment: 'processing_equipment',
  cannabis_inventory: 'cannabis_inventory',
  wanted_request: 'wanted_requests',
  service: 'services',
  business_opportunity: 'business_opportunities',
  featured_network_opportunity: 'business_opportunities',
  distressed_inventory: 'distressed_inventory',
  distressed_businesses: 'distressed_businesses',
  genetics_program: 'genetics',
  qualified_access_request: 'qualified_access',
  education_resource: 'education',
  licensing_opportunity: 'licensing_opportunities',
  real_estate_facility: 'real_estate_facilities',
  technology_software: 'technology_software',
  investment_opportunity: 'investment_opportunities',
  research_asset: 'research_assets',
}

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const inputCls =
  'mt-1.5 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-[#F5F1E8]/25 outline-none focus:border-[#C6A55A] transition-colors'

function renderField(field: MarketplaceIntakeField) {
  const label = (
    <span className="text-sm text-[#F5F1E8]/70">
      {field.label}
      {field.required && <span className="ml-1 text-red-400">*</span>}
    </span>
  )
  if (field.type === 'textarea') {
    return (
      <label key={field.name} className="block">
        {label}
        <textarea
          name={field.name}
          rows={3}
          required={field.required}
          placeholder={field.placeholder}
          className={inputCls}
        />
      </label>
    )
  }
  if (field.type === 'select') {
    return (
      <label key={field.name} className="block">
        {label}
        <select name={field.name} required={field.required} className={inputCls}>
          <option value="">Select</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }
  if (field.type === 'checkbox') {
    return (
      <label
        key={field.name}
        className="flex items-center gap-3 rounded-xl border border-[#C6A55A]/10 bg-[#061322]/60 px-3 py-2.5 text-sm text-[#F5F1E8]/70 cursor-pointer hover:border-[#C6A55A]/25 transition-colors"
      >
        <input name={field.name} type="checkbox" value="yes" className="h-4 w-4 rounded" />
        {field.label}
      </label>
    )
  }
  return (
    <label key={field.name} className="block">
      {label}
      <input
        name={field.name}
        required={field.required}
        placeholder={field.placeholder}
        className={inputCls}
      />
    </label>
  )
}

interface DynamicMarketplaceIntakeFormProps {
  defaultType?: string
  defaultHeadline?: string
  defaultMarkets?: string
  onViewSubmissions?: () => void
}

export function DynamicMarketplaceIntakeForm({
  defaultType,
  defaultHeadline = '',
  defaultMarkets = '',
  onViewSubmissions,
}: DynamicMarketplaceIntakeFormProps) {
  const resolvedDefault =
    resolveMarketplaceListingTypeOption(defaultType) ?? 'Used / Surplus Equipment'

  const [listingType, setListingType] =
    useState<MarketplaceListingTypeOption>(resolvedDefault)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const previewUrlsRef = useRef<string[]>([])

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewUrlsRef.current = []
  }, [])

  const typeKey: MarketplaceListingTypeKey =
    TYPE_KEY_BY_LABEL[listingType] ?? 'used_surplus_equipment'

  const fieldsets = useMemo(() => getFieldsetsForListingType(typeKey), [typeKey])

  function replaceImagePreviews(files: File[]) {
    const nextUrls = files.map(file => URL.createObjectURL(file))
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewUrlsRef.current = nextUrls
    setImagePreviews(nextUrls)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from<File>(event.target.files ?? []).filter(
      (file) => file.size <= MAX_IMAGE_BYTES,
    )
    const combined = [...imageFiles, ...incoming].slice(0, MAX_IMAGES)
    setImageFiles(combined)
    replaceImagePreviews(combined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    const updated = imageFiles.filter((_, itemIndex) => itemIndex !== index)
    setImageFiles(updated)
    replaceImagePreviews(updated)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setSubmitStatus('Submitting…')

    const formEl = event.currentTarget
    const data = new FormData(formEl)
    data.set('category_key', CATEGORY_KEY_BY_TYPE[typeKey] ?? typeKey)
    data.set('listing_type_key', typeKey)
    imageFiles.forEach((file) => data.append('images', file))

    try {
      const response = await fetch('/api/marketplace/submit', {
        method: 'POST',
        body: data,
      })

      const result = (await response.json().catch(() => null)) as {
        message?: string
        error?: string
      } | null

      if (response.ok) {
        setSuccess(true)
        setSubmitStatus(
          result?.message ??
          'Submission received. Harbourview will review your listing within 2 business days.',
        )
        formEl.reset()
        setImageFiles([])
        replaceImagePreviews([])
      } else {
        setSubmitStatus(result?.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitStatus('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    const submissionActionClass =
      'rounded-full bg-[#C6A55A] px-5 py-2.5 text-sm font-semibold text-[#061322] hover:bg-[#D8BD75] transition-colors'

    return (
      <div className="rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F]/90 p-10 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/10">
          <svg
            className="h-6 w-6 text-[#C6A55A]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[#F5F1E8]">Submission received</h2>
        <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/60">{submitStatus}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onViewSubmissions ? (
            <button type="button" onClick={onViewSubmissions} className={submissionActionClass}>
              View my submissions →
            </button>
          ) : (
            <Link href="/dashboard?page=marketplace" className={submissionActionClass}>
              View my submissions →
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setSuccess(false)
              setSubmitStatus(null)
            }}
            className="rounded-full border border-[#C6A55A]/30 px-5 py-2.5 text-sm text-[#F5F1E8]/70 hover:text-[#F5F1E8] transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-8 rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F]/90 p-6 shadow-2xl shadow-black/30 md:p-8"
    >
      <input type="text" name="hp_field" className="hidden" tabIndex={-1} autoComplete="off" />

      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">
          Private marketplace intake
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#F5F1E8]">
          Submit supply, assets, services, or demand
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/60">
          All submissions enter Harbourview operator review before any routing or visibility.
          Private details remain off public pages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-[#F5F1E8]/70">Listing type</span>
          <select
            name="listing_type"
            value={listingType}
            onChange={(event) =>
              setListingType(event.target.value as MarketplaceListingTypeOption)
            }
            className={inputCls}
          >
            {MARKETPLACE_LISTING_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-[#F5F1E8]/70">
            Price / budget / range{' '}
            <span className="text-[#F5F1E8]/30">(optional)</span>
          </span>
          <input name="price_or_budget" placeholder="e.g. CAD 50,000 or negotiable" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-[#F5F1E8]/70">
          Title <span className="text-red-400">*</span>
        </span>
        <input
          name="title"
          required
          minLength={3}
          placeholder="Clear, specific description of what you're listing"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="text-sm text-[#F5F1E8]/70">
          Description <span className="text-red-400">*</span>
        </span>
        <textarea
          name="message"
          rows={5}
          required
          placeholder="Key details, specs, quantities, timelines, any constraints"
          className={inputCls}
        />
      </label>

      {defaultHeadline && (
        <label className="block">
          <span className="text-sm text-[#F5F1E8]/70">Listing headline</span>
          <input name="listing_headline" defaultValue={defaultHeadline} className={inputCls} />
        </label>
      )}
      {defaultMarkets && (
        <label className="block">
          <span className="text-sm text-[#F5F1E8]/70">Target markets</span>
          <input name="target_markets" defaultValue={defaultMarkets} className={inputCls} />
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-[#F5F1E8]/70">
            Company <span className="text-[#F5F1E8]/30">(optional)</span>
          </span>
          <input name="contact_company" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm text-[#F5F1E8]/70">
            Phone <span className="text-[#F5F1E8]/30">(optional)</span>
          </span>
          <input name="contact_phone" className={inputCls} />
        </label>
      </div>

      {fieldsets.map((fieldset) => (
        <section
          key={fieldset.key}
          className="space-y-4 rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5"
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">
            {fieldset.label}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldset.fields.map(renderField)}
          </div>
        </section>
      ))}

      <section className="space-y-3 rounded-2xl border border-[#C6A55A]/10 bg-[#061322]/45 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">
            Images
          </h3>
          <span className="text-xs text-[#F5F1E8]/35">
            {imageFiles.length}/{MAX_IMAGES} · JPG, PNG, WebP · max 10 MB each
          </span>
        </div>

        {imageFiles.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-[#C6A55A]/25 py-4 text-sm text-[#C6A55A]/60 hover:border-[#C6A55A]/50 hover:text-[#C6A55A] transition-colors"
          >
            + Add images
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />

        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, index) => (
              <div key={src} className="relative h-24 w-24 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-24 rounded-xl object-cover border border-[#C6A55A]/20"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#C6A55A]/20 bg-[#061322] text-xs text-[#F5F1E8]/50 hover:text-[#F5F1E8] transition-colors"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#061322] hover:bg-[#D8BD75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting…' : 'Submit for Harbourview review'}
        </button>
        {submitStatus && !success && (
          <p className="text-sm text-[#F5F1E8]/55">{submitStatus}</p>
        )}
      </div>

      <p className="text-xs text-[#F5F1E8]/30 leading-5">
        By submitting you confirm you have authority to list this asset and agree to
        Harbourview&apos;s operator vetting process. No public visibility is granted without
        explicit Harbourview approval.
      </p>
    </form>
  )
}
