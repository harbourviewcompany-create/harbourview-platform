import 'server-only';

type MarketplaceInquiryNotification = {
  inquiry_type: string;
  priority?: string | null;
  contact_name: string;
  contact_company?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  message: string;
  id?: string | null;
  created_at?: string | null;
};

export type NotificationResult =
  | { status: 'skipped'; reason: 'missing_recipient' }
  | { status: 'skipped'; reason: 'missing_provider' };

export async function notifyMarketplaceInquiry(inquiry: MarketplaceInquiryNotification): Promise<NotificationResult> {
  const recipient = process.env.HARBOURVIEW_MARKETPLACE_NOTIFY_EMAIL?.trim();
  if (!recipient) return { status: 'skipped', reason: 'missing_recipient' };

  const createdAt = inquiry.created_at || new Date().toISOString();
  const adminLink = inquiry.id
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://harbourview-platform.vercel.app'}/admin/inquiries/${inquiry.id}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://harbourview-platform.vercel.app'}/admin/inquiries`;

  console.info('harbourview_marketplace_notification_intent', {
    code: 'MISSING_NOTIFICATION_PROVIDER',
    to: recipient,
    subject: `New Harbourview marketplace inquiry: ${inquiry.inquiry_type}`,
    body: [
      'New Harbourview marketplace inquiry received.',
      '',
      `Type: ${inquiry.inquiry_type}`,
      `Priority: ${inquiry.priority || 'medium'}`,
      `Name: ${inquiry.contact_name}`,
      `Company: ${inquiry.contact_company || 'Not provided'}`,
      `Email: ${inquiry.contact_email}`,
      `Phone: ${inquiry.contact_phone || 'Not provided'}`,
      `Message: ${inquiry.message}`,
      `Admin link: ${adminLink}`,
      `Created at: ${createdAt}`,
    ].join('\n'),
  });

  return { status: 'skipped', reason: 'missing_provider' };
}
