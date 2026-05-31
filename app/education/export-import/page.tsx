import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export default function ExportImportPage() {
  redirect('/education/export-import-readiness')
}
