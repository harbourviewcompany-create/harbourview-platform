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
  listing_id?: string | null;
  listing_title?: string | null;
};

const MISSING_NOTIFICATION_PROVIDER = 'MISSING_NOTIFICATION_PROVIDER';

export type NotificationResult =
  | { status: 'sent'; to: string }
  | { status: 'skipped'; reason: 'missing_recipient' }
  | { status: 'skipped'; reason: 'missing_api_key' }
  | { status: 'skipped'; reason: 'send_failed'; error?: string };

function escapeHtml(value: string) {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEmailHtml(
  inquiry: MarketplaceInquiryNotification,
  adminLink: string,
  opts?: { sellerFacing?: boolean },
): string {
  const rows = [
    ['Type', inquiry.inquiry_type],
    ['Priority', inquiry.priority || 'medium'],
    ['Name', inquiry.contact_name],
    ['Company', inquiry.contact_company || 'Not provided'],
    ['Email', inquiry.contact_email],
    ['Phone', inquiry.contact_phone || 'Not provided'],
    ['Listing', inquiry.listing_title || inquiry.listing_id || 'Not linked'],
    ['Created', inquiry.created_at || new Date().toISOString()],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="padding:6px 0;font-size:13px;color:#111827">${escapeHtml(String(value))}</td>
      </tr>`,
    )
    .join('');

  const title = opts?.sellerFacing
    ? 'Buyer inquiry on your Harbourview listing'
    : 'New marketplace inquiry';

  const footer = opts?.sellerFacing
    ? 'Reply to the buyer email above to continue the conversation. Harbourview mediated this introduction and remains available if you need support.'
    : 'This notification was sent by Harbourview Network. Do not reply to this email.';

  const cta = opts?.sellerFacing
    ? ''
    : `<div style="margin:24px 0 0">
      <a href="${adminLink}" style="display:inline-block;padding:10px 20px;background:#C6A55A;color:#081423;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600">View in admin</a>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C6A55A">Harbourview Network</p>
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#111827">${title}</h1>
    <table style="width:100%;border-collapse:collapse">${tableRows}</table>
    <div style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#6b7280">Message</p>
      <p style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>
    </div>
    ${cta}
    <p style="margin:24px 0 0;font-size:11px;color:#9ca3af">${footer}</p>
  </div>
</body>
</html>`;
}

async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
}): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info('harbourview_marketplace_notification_skipped', {
      reason: MISSING_NOTIFICATION_PROVIDER,
      to: params.to,
    });
    return { status: 'skipped', reason: 'missing_api_key' };
  }

  const from = process.env.HARBOURVIEW_FROM_EMAIL?.trim() || 'notifications@harbourview.co';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.info('harbourview_marketplace_notification_failed', {
        to: params.to,
        status: response.status,
        body: errText.slice(0, 200),
      });
      return { status: 'skipped', reason: 'send_failed', error: errText.slice(0, 200) };
    }

    console.info('harbourview_marketplace_notification_sent', { to: params.to });
    return { status: 'sent', to: params.to };
  } catch (error) {
    return {
      status: 'skipped',
      reason: 'send_failed',
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}

export async function notifyMarketplaceInquiry(
  inquiry: MarketplaceInquiryNotification,
): Promise<NotificationResult> {
  const recipient =
    process.env.HARBOURVIEW_MARKETPLACE_NOTIFY_EMAIL?.trim() ||
    process.env.HARBOURVIEW_TO_EMAIL?.trim();

  if (!recipient) {
    return { status: 'skipped', reason: 'missing_recipient' };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://harbourview.vercel.app';
  const adminLink = inquiry.id
    ? `${site}/admin/inquiries/${inquiry.id}`
    : `${site}/admin/inquiries`;

  const subject = `New inquiry: ${inquiry.inquiry_type} — ${inquiry.contact_name}${
    inquiry.contact_company ? ` (${inquiry.contact_company})` : ''
  }`;

  return sendResendEmail({
    to: recipient,
    subject,
    html: buildEmailHtml(inquiry, adminLink),
  });
}

/** Notify the listing seller (Tier A open commercial). Does not replace admin notify. */
export async function notifySellerOfListingInquiry(
  sellerEmail: string,
  inquiry: MarketplaceInquiryNotification,
): Promise<NotificationResult> {
  const to = sellerEmail.trim().toLowerCase();
  if (!to || !to.includes('@')) {
    return { status: 'skipped', reason: 'missing_recipient' };
  }

  // Never email the buyer their own inquiry back as "seller"
  if (to === inquiry.contact_email.trim().toLowerCase()) {
    return { status: 'skipped', reason: 'missing_recipient' };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://harbourview.vercel.app';
  const subject = inquiry.listing_title
    ? `Buyer inquiry: ${inquiry.listing_title}`
    : 'Buyer inquiry on your Harbourview listing';

  return sendResendEmail({
    to,
    subject,
    html: buildEmailHtml(inquiry, site, { sellerFacing: true }),
    replyTo: inquiry.contact_email,
  });
}
