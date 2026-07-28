import { redirect } from 'next/navigation'

/** Legacy alias — public listings board. */
export default function OpportunitiesPage() {
  redirect('/marketplace/listings')
}
