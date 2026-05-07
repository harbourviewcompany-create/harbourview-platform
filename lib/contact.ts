const BRANDED_CONTACT_EMAIL = ['hello', 'harbourview.co'].join('@')

export const HARBOURVIEW_CONTACT = {
  email: BRANDED_CONTACT_EMAIL,
  mailtoHref: `mailto:${BRANDED_CONTACT_EMAIL}`,
  phone: null,
  phoneHref: null,
  whatsapp: null,
  whatsappHref: null,
  telegram: null,
  telegramHref: null,
  publicBaseUrl: 'https://harbourview-platform.vercel.app',
} as const

export const CONTACT_EMAIL = HARBOURVIEW_CONTACT.email
export const CONTACT_MAILTO_HREF = HARBOURVIEW_CONTACT.mailtoHref
