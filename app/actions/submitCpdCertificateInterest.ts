'use server'

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCpdModule } from '@/lib/education/cpdCatalog'

export type CpdInterestState =
  | { status: 'idle'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

function str(form: FormData, key: string, max: number): string {
  const v = form.get(key)
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export async function submitCpdCertificateInterest(
  _prev: CpdInterestState,
  form: FormData,
): Promise<CpdInterestState> {
  if (str(form, 'website', 100)) {
    return { status: 'success', message: 'Inquiry received.' }
  }

  const contact_name = str(form, 'contact_name', 200)
  const contact_email = str(form, 'contact_email', 200)
  const contact_company = str(form, 'contact_company', 200)
  const module_slug = str(form, 'module_slug', 120)
  const professional_body = str(form, 'professional_body', 200)
  const message = str(form, 'message', 1500)
  const consent = form.get('consent')

  if (!contact_name || !contact_email.includes('@') || !module_slug || !consent) {
    return { status: 'error', message: 'Please complete required fields.' }
  }

  const mod = getCpdModule(module_slug)
  if (!mod || !mod.certificateEligible) {
    return { status: 'error', message: 'Selected module is not open for certificate interest.' }
  }

  try {
    const supabase = await createSupabaseServiceClient()
    const { error } = await supabase.from('marketplace_inquiries').insert({
      inquiry_type: 'cpd_certificate_interest',
      contact_name,
      contact_email,
      contact_company: contact_company || null,
      message: [
        `Module: ${mod.title} (${mod.slug})`,
        `Nominal hours: ${mod.nominalHours}`,
        professional_body ? `Professional body / context: ${professional_body}` : null,
        message ? `Notes: ${message}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      metadata: {
        module_slug: mod.slug,
        module_id: mod.id,
        nominal_hours: mod.nominalHours,
        professional_body: professional_body || null,
      },
    })

    if (error) {
      console.error('[cpd_certificate_interest]', error.message)
      return {
        status: 'error',
        message: 'Could not save inquiry. Try again or use confidential intake.',
      }
    }
  } catch (e) {
    console.error('[cpd_certificate_interest]', e)
    return {
      status: 'error',
      message: 'Could not save inquiry. Try again or use confidential intake.',
    }
  }

  return {
    status: 'success',
    message:
      'Certificate interest received. Harbourview will review before any partner pathway or formal CPD credit discussion.',
  }
}
