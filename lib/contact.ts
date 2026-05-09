const CURRENT_CONTACT_EMAIL = 'harbourviewcompany@gmail.com'

export const HARBOURVIEW_CONTACT = {
  email: CURRENT_CONTACT_EMAIL,
  mailtoHref: `mailto:${CURRENT_CONTACT_EMAIL}`,
  phone: null,
  phoneHref: null,
  whatsapp: null,
  whatsappHref: null,
  telegram: null,
  telegramHref: null,
  publicBaseUrl: 'https://harbourview.vercel.app',
} as const

export const CONTACT_EMAIL = HARBOURVIEW_CONTACT.email
export const CONTACT_MAILTO_HREF = HARBOURVIEW_CONTACT.mailtoHref
