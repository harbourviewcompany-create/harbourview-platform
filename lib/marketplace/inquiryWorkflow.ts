export const REVIEW_STATUSES = ['received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export type InquiryPriority = (typeof PRIORITIES)[number];

export type InquiryTemplateKey = 'listing_submission' | 'wanted_request_submission' | 'quote_general' | 'not_fit';

export type InquiryTemplate = {
  key: InquiryTemplateKey;
  label: string;
  subject: string;
  body: string;
};

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  received: 'Received',
  reviewing: 'Reviewing',
  contacted: 'Contacted',
  qualified: 'Qualified',
  not_fit: 'Not fit',
  closed: 'Closed',
};

export const priorityLabels: Record<InquiryPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function isInquiryPriority(value: string): value is InquiryPriority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export function getInquiryTypeLabel(inquiryType: string) {
  if (inquiryType === 'listing_submission') return 'Listing submission';
  if (inquiryType === 'wanted_request_submission') return 'Wanted request';
  if (inquiryType === 'quote_request' || inquiryType === 'quote_routing') return 'Quote/general inquiry';
  return inquiryType.replaceAll('_', ' ');
}

export function getPriorityRank(priority: string) {
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  return 2;
}

export function getRecommendedTemplateKey(inquiryType: string): InquiryTemplateKey {
  if (inquiryType === 'listing_submission') return 'listing_submission';
  if (inquiryType === 'wanted_request_submission') return 'wanted_request_submission';
  return 'quote_general';
}

export const responseTemplates: InquiryTemplate[] = [
  {
    key: 'listing_submission',
    label: 'Listing submission',
    subject: 'Harbourview marketplace listing received',
    body: `Thanks for submitting your listing to Harbourview.

We've received it and are reviewing whether it is suitable for marketplace publication or private commercial handling.

To complete review, please confirm:

1. Product, asset or service being offered
2. Location
3. Quantity or availability
4. Target buyer type
5. Timing
6. Any restrictions, certifications or commercial terms we should know

Once we have that, we can determine whether this should be listed publicly, held privately or routed through a more direct commercial path.

Regards,

Harbourview`,
  },
  {
    key: 'wanted_request_submission',
    label: 'Wanted request',
    subject: 'Harbourview wanted request received',
    body: `Thanks for submitting your wanted request.

To assess whether Harbourview can help identify suitable supply or counterparties, please confirm:

1. Product, asset or service required
2. Target market or delivery location
3. Quantity or scale
4. Required timing
5. Buyer/company profile
6. Any required standards, certifications or restrictions

Once clarified, we can determine whether this should be handled as a marketplace request, private sourcing requirement or direct commercial introduction.

Regards,

Harbourview`,
  },
  {
    key: 'quote_general',
    label: 'Quote/general inquiry',
    subject: 'Harbourview inquiry received',
    body: `Thanks for contacting Harbourview.

We've received your inquiry and are reviewing the best route for it.

To move this forward, please confirm:

1. What you are looking to buy, sell or discuss
2. Your company and role
3. Target market or geography
4. Timing
5. Any relevant commercial constraints

Once we have that, we can route the inquiry appropriately.

Regards,

Harbourview`,
  },
  {
    key: 'not_fit',
    label: 'Not fit',
    subject: 'Harbourview inquiry review',
    body: `Thanks for submitting your inquiry.

After review, this does not appear to fit Harbourview's current marketplace or commercial-intelligence focus.

We will keep the information on file in case there is a relevant fit later.

Regards,

Harbourview`,
  },
];
