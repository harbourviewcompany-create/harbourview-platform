import Link from 'next/link'

interface InquiryLinkProps {
  subject: string
  label?: string
  listingTitle?: string
}

export default function InquiryLink({
  subject,
  label = 'Inquire to Buy',
  listingTitle,
}: InquiryLinkProps) {
  const title = listingTitle || subject.replace(/^Inquiry:\s*/i, '').replace(/^Supplier Inquiry:\s*/i, '')
  const href = `/marketplace/quote?listing=${encodeURIComponent(title)}`

  return (
    <Link href={href} className="btn-outline text-xs px-4 py-2">
      {label}
    </Link>
  )
}
