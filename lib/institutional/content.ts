export type ModuleItem = {
  title: string
  description: string
  href?: string
  eyebrow?: string
}

export type InstitutionalPageContent = {
  eyebrow: string
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  sections: {
    title: string
    description: string
    items: ModuleItem[]
  }[]
  boundary?: string
}

export const PUBLIC_PRIVATE_BOUNDARY =
  'Harbourview is intentionally not an open-contact directory. Public pages support discovery and context. Sensitive commercial, regulatory, documentary and counterparty information is handled through reviewed private workflows.'

export const EDUCATION_DISCLAIMER =
  'Harbourview education is informational and non-promotional. It does not provide medical advice, prescribing instructions or treatment recommendations. Unless expressly stated, Harbourview education is not accredited continuing education.'

export const POLICY_DISCLAIMER =
  'Harbourview policy resources are educational and comparative. They do not represent government endorsement, legal advice or official regulatory guidance.'

export const ASSESSMENT_DISCLAIMER =
  'Assessment requests are reviewed by Harbourview and do not produce automated legal, regulatory, medical or compliance conclusions.'

export const intelligenceModules: ModuleItem[] = [
  {
    title: 'Country Briefs',
    description: 'High-level country context for access models, commercial maturity, pathway considerations and reviewed opportunity categories.',
    href: '/intelligence/country-briefs',
  },
  {
    title: 'Licensing Pathways',
    description: 'Country-level explainers on licensing structures, importer and distributor roles, dispensing models and documentation expectations.',
    href: '/intelligence/licensing-pathways',
  },
  {
    title: 'Regulatory Pathways',
    description: 'Structured pathway context for regulated market access, public-health safeguards and authority-facing considerations.',
    href: '/intelligence/regulatory-pathways',
  },
  {
    title: 'Counterparty Intelligence',
    description: 'Public-safe framing for reviewed counterparty discovery, confidential routing and private evidence handling.',
    href: '/intelligence/counterparty-intelligence',
  },
  {
    title: 'Logistics & Trade Routes',
    description: 'Education on controlled logistics, chain of custody, route feasibility, documentation and shipment risk considerations.',
    href: '/intelligence/logistics-trade-routes',
  },
]

export const educationTracks: ModuleItem[] = [
  { title: 'Clinical Education', description: 'Non-promotional resources for clinicians, care teams and medical-market stakeholders.', href: '/network/clinical-education' },
  { title: 'Pharmacy Education', description: 'Dispensing workflows, controlled handling concepts, patient counseling context and product-format education.' },
  { title: 'Quality & Compliance', description: 'GMP, GACP, GDP, batch documentation, CoA review, supplier qualification and audit readiness.' },
  { title: 'Importer & Distributor', description: 'Route feasibility, supplier intake, documentation review, product onboarding and distribution readiness.' },
  { title: 'Cultivation & Production', description: 'Production controls, post-harvest discipline, genetics integrity, batch consistency and export readiness.' },
  { title: 'Procurement', description: 'Supplier assessment, documentation review, product evaluation, substitution risk and buyer readiness.' },
  { title: 'Regulatory & Policy', description: 'Access model comparisons, quality safeguards, diversion prevention and market conduct education.' },
  { title: 'Investor Due Diligence', description: 'License quality, compliance exposure, operating maturity, market viability and defensibility.' },
  { title: 'Laboratory & Testing', description: 'CoA integrity, contaminant testing, method reliability, stability and lab due diligence concepts.' },
  { title: 'Pharmacovigilance & Safety', description: 'Product complaints, adverse event concepts, recall readiness, post-market surveillance and safety signals.' },
]

export const policyModules: ModuleItem[] = [
  { title: 'Regulatory Observatory', description: 'A structured home for policy movement, licensing model comparisons and reviewed regulatory change context.' },
  { title: 'Standards Library', description: 'Checklists and explainers for documentation, quality, procurement, product safety and responsible market conduct.' },
  { title: 'Public-Health Safeguards', description: 'Diversion prevention, patient-safety context, market conduct principles and controlled-access safeguards.' },
  { title: 'Licensing Models', description: 'Comparative education on medical access, importer, distributor, pharmacy and cultivation models.' },
  { title: 'Market Conduct', description: 'Responsible commercialization, conflict controls, advertising caution and institutional conduct principles.' },
  { title: 'Product Safety & Recall', description: 'Recall readiness education, batch traceability, withdrawal pathways and field safety communication concepts.' },
]

export const assessmentModules: ModuleItem[] = [
  { title: 'Country Pathway Assessment', description: 'A reviewed request path for assessing country-level route feasibility and access considerations.' },
  { title: 'Export Readiness', description: 'A commercial readiness review for suppliers seeking international market access.' },
  { title: 'Importer Readiness', description: 'A review path for importer, distributor and intake preparedness.' },
  { title: 'Supplier Documentation', description: 'A structured review of supplier documentation, quality evidence and commercial readiness.' },
  { title: 'Counterparty Fit', description: 'A controlled request path for assessing role fit, seriousness and route compatibility.' },
  { title: 'Due Diligence Readiness', description: 'A readiness pathway for investors, acquirers and operators preparing institutional review materials.' },
]

export const trustModules: ModuleItem[] = [
  { title: 'Editorial Review', description: 'Reviewed publication standards, topic ownership, update discipline and correction handling.' },
  { title: 'Source Standards', description: 'Source discipline, evidence grading, confidence language and separation of public summaries from private materials.' },
  { title: 'Data Governance', description: 'Commercial sensitivity rules, access controls, document retention principles and audit trail framing.' },
  { title: 'Confidentiality Model', description: 'Controlled handling for counterparties, private inquiries, assessment submissions and introduction pathways.' },
  { title: 'Product Safety', description: 'Product complaint concepts, batch traceability, recall readiness and post-market safety education.' },
  { title: 'Credentialing Roadmap', description: 'Reviewer governance, completion records and future institutional education partnership pathways without premature accreditation claims.' },
]

export const hubPages: Record<string, InstitutionalPageContent> = {
  network: {
    eyebrow: 'Controlled commercial network',
    title: 'Harbourview Network',
    description:
      'Controlled commercial discovery for regulated cannabis products, services, suppliers, wanted requests and market-access opportunities.',
    primaryCta: { label: 'Enter Network', href: '/marketplace' },
    secondaryCta: { label: 'Submit Listing', href: '/marketplace/sell' },
    boundary: PUBLIC_PRIVATE_BOUNDARY,
    sections: [
      {
        title: 'Network access layers',
        description: 'Public discovery stays controlled while sensitive routing is handled through reviewed inquiry workflows.',
        items: [
          { title: 'Listings', description: 'Public-safe listing summaries across relevant product, service and supply-chain categories.', href: '/marketplace' },
          { title: 'Wanted Requests', description: 'Buyer-side demand signals expressed without exposing confidential contact details.', href: '/marketplace/wanted' },
          { title: 'Supplier Directory', description: 'Supplier discovery with restrained claims and controlled inquiry paths.', href: '/supplier-directory' },
          { title: 'Qualified Routing', description: 'Reviewed inquiry handling for introductions, supplier interest and commercial fit.' },
        ],
      },
    ],
  },
  opportunities: {
    eyebrow: 'Reviewed commercial openings',
    title: 'Opportunities',
    description:
      'A higher-discretion layer for country access openings, distribution mandates, strategic partnerships and serious commercial opportunities.',
    primaryCta: { label: 'Submit Opportunity', href: '/marketplace/sell' },
    secondaryCta: { label: 'Request Opportunity Review', href: '/contact' },
    boundary: PUBLIC_PRIVATE_BOUNDARY,
    sections: [
      {
        title: 'Opportunity categories',
        description: 'Public pages can describe opportunity types while sensitive parties, terms and route details remain private.',
        items: [
          { title: 'Country Access', description: 'Potential market-entry openings and country-specific access pathways requiring review.' },
          { title: 'Distribution Mandates', description: 'Reviewed distributor, importer and commercial channel opportunities.' },
          { title: 'Strategic Partnerships', description: 'Operator, supplier, service, clinical, research and institutional collaboration pathways.' },
          { title: 'Asset & Business Packages', description: 'Facility, surplus, bulk, operational and business opportunity categories handled with discretion.' },
        ],
      },
    ],
  },
  intelligence: {
    eyebrow: 'Country, pathway and counterparty context',
    title: 'Intelligence',
    description:
      'Reviewed country, licensing, regulatory, category, counterparty and trade-route context for disciplined market access.',
    primaryCta: { label: 'Request Intelligence Brief', href: '/contact' },
    secondaryCta: { label: 'Explore Country Briefs', href: '/intelligence/country-briefs' },
    boundary: 'Public intelligence is high-level and reviewed as available. Harbourview does not publish sensitive source evidence, private counterparty details or confidential commercial route information publicly.',
    sections: [
      {
        title: 'Intelligence modules',
        description: 'Public modules establish structure and request paths while deeper analyst material remains private.',
        items: intelligenceModules,
      },
    ],
  },
  education: {
    eyebrow: 'Professional education',
    title: 'Education',
    description:
      'Non-promotional professional education for clinical, pharmacy, quality, commercial, regulatory and institutional stakeholders.',
    primaryCta: { label: 'Explore Education Tracks', href: '#education-tracks' },
    secondaryCta: { label: 'Request Education Partnership', href: '/institutional-partnerships' },
    boundary: EDUCATION_DISCLAIMER,
    sections: [
      {
        title: 'Education tracks',
        description: 'Clinical education sits inside a broader professional education system for regulated medical cannabis markets.',
        items: educationTracks,
      },
    ],
  },
  policy: {
    eyebrow: 'Policy and standards',
    title: 'Policy & Standards',
    description:
      'Structured non-promotional resources on regulated access models, licensing pathways, quality standards, public-health safeguards and responsible market conduct.',
    primaryCta: { label: 'Explore Standards Library', href: '/policy-standards' },
    secondaryCta: { label: 'Institutional Inquiry', href: '/institutional-partnerships' },
    boundary: POLICY_DISCLAIMER,
    sections: [
      {
        title: 'Regulator-facing resource areas',
        description: 'The policy layer is neutral, comparative and evidence-led. It does not imply government endorsement.',
        items: policyModules,
      },
    ],
  },
  assessments: {
    eyebrow: 'Readiness and feasibility',
    title: 'Assessments',
    description:
      'Controlled intake pathways for assessing market-access readiness, country-route feasibility, supplier documentation, counterparty fit and due diligence preparedness.',
    primaryCta: { label: 'Request Assessment', href: '/contact' },
    secondaryCta: { label: 'View Assessment Types', href: '#assessment-types' },
    boundary: ASSESSMENT_DISCLAIMER,
    sections: [
      {
        title: 'Assessment types',
        description: 'Assessment pages route to reviewed inquiry capture rather than instant conclusions.',
        items: assessmentModules,
      },
    ],
  },
  institutional: {
    eyebrow: 'Institutional collaboration',
    title: 'Institutional Partnerships',
    description:
      'Collaboration pathways for regulators, associations, universities, clinical groups, pharmacies, labs, logistics providers and standards bodies.',
    primaryCta: { label: 'Start Institutional Conversation', href: '/contact' },
    secondaryCta: { label: 'Review Trust Standards', href: '/trust-governance' },
    boundary: 'Participation does not imply endorsement, approval or official status unless explicitly documented.',
    sections: [
      {
        title: 'Partnership pathways',
        description: 'Harbourview is designed to support quality, safety, transparency, education and disciplined market development.',
        items: [
          { title: 'Regulator Resources', description: 'Neutral resources for policy comparison, safeguards, access models and market conduct.' },
          { title: 'Association Collaboration', description: 'Structured education and standards collaboration with industry and professional bodies.' },
          { title: 'Research Collaboration', description: 'University, clinical and evidence-focused collaboration pathways.' },
          { title: 'Lab, Logistics & Standards', description: 'Partnership pathways for testing, quality, trade route and standards stakeholders.' },
        ],
      },
    ],
  },
  trust: {
    eyebrow: 'Trust, safety and governance',
    title: 'Trust, Safety & Governance',
    description:
      'A formal platform layer for claim discipline, source review, confidentiality, evidence standards, product safety principles and controlled information handling.',
    primaryCta: { label: 'Contact Harbourview', href: '/contact' },
    secondaryCta: { label: 'Review Policy & Standards', href: '/policy-standards' },
    boundary: 'Sensitive commercial information, evidence materials, analyst notes and counterparty identities are handled through controlled private workflows and are not intended for public display.',
    sections: [
      {
        title: 'Governance controls',
        description: 'This layer protects institutional credibility and separates education, commercial routing and private intelligence.',
        items: trustModules,
      },
    ],
  },
}

export const footerGroups = [
  {
    title: 'Network',
    links: [
      { label: 'Listings', href: '/marketplace' },
      { label: 'Wanted Requests', href: '/marketplace/wanted' },
      { label: 'Supplier Directory', href: '/supplier-directory' },
      { label: 'Submit Listing', href: '/marketplace/sell' },
      { label: 'Request Introduction', href: '/contact' },
    ],
  },
  {
    title: 'Opportunities',
    links: [
      { label: 'Commercial Opportunities', href: '/opportunities' },
      { label: 'Country Access', href: '/opportunities' },
      { label: 'Distribution Mandates', href: '/opportunities' },
      { label: 'Strategic Partnerships', href: '/opportunities' },
      { label: 'Submit Opportunity', href: '/marketplace/sell' },
    ],
  },
  {
    title: 'Intelligence',
    links: intelligenceModules.map((item) => ({ label: item.title, href: item.href ?? '/intelligence' })),
  },
  {
    title: 'Education',
    links: educationTracks.map((item) => ({ label: item.title, href: item.href ?? '/education' })),
  },
  {
    title: 'Policy & Standards',
    links: [
      { label: 'Regulatory Observatory', href: '/policy-standards' },
      { label: 'Standards Library', href: '/policy-standards' },
      { label: 'Public-Health Safeguards', href: '/policy-standards' },
      { label: 'Licensing Models', href: '/policy-standards' },
      { label: 'Market Conduct', href: '/policy-standards' },
      { label: 'Product Safety & Recall', href: '/policy-standards' },
    ],
  },
  {
    title: 'Assessments',
    links: assessmentModules.map((item) => ({ label: item.title, href: '/assessments' })),
  },
  {
    title: 'Institutional',
    links: [
      { label: 'Institutional Partnerships', href: '/institutional-partnerships' },
      { label: 'Regulator Resources', href: '/institutional-partnerships' },
      { label: 'Association Collaboration', href: '/institutional-partnerships' },
      { label: 'Research Collaboration', href: '/institutional-partnerships' },
      { label: 'Education Partnerships', href: '/institutional-partnerships' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Trust, Safety & Governance', href: '/trust-governance' },
      { label: 'Evidence Standards', href: '/trust-governance' },
      { label: 'Source Policy', href: '/trust-governance' },
      { label: 'Correction Policy', href: '/trust-governance' },
      { label: 'Confidentiality', href: '/trust-governance' },
      { label: 'Data Governance', href: '/trust-governance' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Request Access', href: '/contact' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
    ],
  },
]
