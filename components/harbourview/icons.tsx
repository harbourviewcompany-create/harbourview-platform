export function SearchIcon({ className, style }: { className?: string; style?: Record<string, string | number | undefined> }) {
  return (
    <svg className={className} style={style} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 12.5L15.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function QuestionCircleIcon({ className, style }: { className?: string; style?: Record<string, string | number | undefined> }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5C11.38 5 12.5 6.12 12.5 7.5C12.5 8.88 10 10 10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="13" r="0.75" fill="currentColor" />
    </svg>
  )
}

export function GlobeIcon({ className, style }: { className?: string; style?: Record<string, string | number | undefined> }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 1.5C10 1.5 7 5.5 7 10C7 14.5 10 18.5 10 18.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 1.5C10 1.5 13 5.5 13 10C13 14.5 10 18.5 10 18.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 10H18.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function CheckCircleIcon({ className, style }: { className?: string; style?: Record<string, string | number | undefined> }) {
  return (
    <svg className={className} style={style} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 10L9 12.5L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HamburgerIcon({ className, style }: { className?: string; style?: Record<string, string | number | undefined> }) {
  return (
    <svg className={className} style={style} width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M0 1H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0 7H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0 13H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
