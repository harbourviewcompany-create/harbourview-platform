interface InquiryLinkProps {
  subject: string
  email: string
  label?: string
}

export default function InquiryLink({
  subject,
  email,
  label = 'Send Inquiry',
}: InquiryLinkProps) {
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`
  return (
    <a href={href} className="btn-outline text-xs px-4 py-2">
      {label}
    </a>
  )
}
