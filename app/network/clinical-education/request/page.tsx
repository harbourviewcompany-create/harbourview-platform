import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/contact?topic=clinical-education')
}
