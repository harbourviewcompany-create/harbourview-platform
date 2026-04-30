interface InquiryLinkProps {
  subject: string
  email?: string
  label?: string
  listingTitle?: string
}

const HARBOURVIEW_EMAIL = 'harbourviewcompany@gmail.com'

export default function InquiryLink({
  subject,
  email,
  label = 'Request Introduction',
  listingTitle,
}: InquiryLinkProps) {
  const body = [
    'Harbourview team,',
    '',
    `I would like to request an introduction for: ${listingTitle || subject.replace(/^Inquiry:\s*/i, '').replace(/^Supplier Inquiry:\s*/i, '')}`,
    email ? `Internal listing contact on file: ${email}` : null,
    '',
    'My company:',
    'Licence / operator status, if applicable:',
    'Location:',
    'What I need:',
    '',
    'Please review and advise on next steps.',
  ]
    .filter(Boolean)
    .join('\n')

  const href = `mailto:${HARBOURVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <a href={href} className="btn-outline text-xs px-4 py-2">
      {label}
    </a>
  )
}
