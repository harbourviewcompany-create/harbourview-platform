import { redirect } from 'next/navigation'

/**
 * Clinical evidence human review lives under the protected admin surface.
 * Keep this route as a stable redirect so bookmarks and deep links still work.
 */
export const dynamic = 'force-dynamic'

export default function ClinicalReviewRedirectPage() {
  redirect('/admin/clinical-review')
}
