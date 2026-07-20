import type { Metadata } from 'next'
import { PublicHero, FormShell } from '@/components/PublicUi'
import SupplierApplicationForm, { FORM_CSS } from './SupplierApplicationForm'

export const metadata: Metadata = {
  title: 'Apply as a Supplier | Harbourview',
  description: 'List your cannabis company in the Harbourview Supplier Directory. All profiles are individually reviewed before publication.',
}

export default function SupplierApplyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <PublicHero
        eyebrow="Supplier Directory"
        title="List your company on Harbourview."
        compact
      >
        Reviewed profiles for producers, distributors, equipment vendors and service providers operating in regulated cannabis markets. Every submission is individually reviewed before publication.
      </PublicHero>
      <FormShell>
        <SupplierApplicationForm />
      </FormShell>
    </>
  )
}
