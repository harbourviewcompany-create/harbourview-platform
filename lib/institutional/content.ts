import { INTAKE_REVIEW_GATING_TEXT, MARKETPLACE_CONFIDENTIALITY_CAVEAT } from '@/lib/content/complianceCopy'

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
  'Public pages give you enough to orient and decide. Sensitive commercial detail, counterparty information, and reviewed introductions move through controlled private workflows — not open directories.'

export const EDUCATION_DISCLAIMER =
  'Harbourview education is informational and non-promotional. It does not provide medical advice, prescribing instructions or treatment recommendations. Unless expressly stated, Harbourview education is not accredited continuing education.'

export const POLICY_DISCLAIMER =
  'Harbourview policy resources are educational and comparative. They do not represent government endorsement, legal advice or official regulatory guidance.'

export const ASSESSMENT_DISCLAIMER =
  'Assessment requests are reviewed by Harbourview and do not produce automated legal, regulatory, medical or compliance conclusions.'

export const intelligenceModules: ModuleItem[] = [
  {
    title: 'Country Briefs',
    description: 'Jurisdiction-level pathway orientation covering access models, commercial maturity, licensing structure and reviewed opportunity categories.',
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
    description: 'Public-safe framing for reviewed counterparty discovery, confidential routing and private source-material handling.',
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
  { title: 'Pharmacy Education', description: 'Dispensing workflows, controlled handling concepts, patient counseling context and product-format education.', href: '/education' },
  { title: 'Quality & Compliance', description: 'GMP, GACP, GDP, batch documentation, CoA review, qualification and audit readiness.', href: '/education' },
  { title: 'Importer & Distributor', description: 'Route feasibility, intake documentation review, product onboarding and distribution readiness.', href: '/education' },
  { title: 'Cultivation & Production', description: 'Production controls, post-harvest discipline, genetics integrity, batch consistency and export readiness.', href: '/education' },
  { title: 'Procurement', description: 'Documentation review, product evaluation, substitution risk and buyer readiness.', href: '/education' },
  { title: 'Regulatory & Policy', description: 'Access model comparisons, quality safeguards, diversion prevention and market conduct education.', href: '/policy-standards' },
  { title: 'Investor Due Diligence', description: 'License quality, compliance exposure, operating maturity, market viability and defensibility.', href: '/professionals' },
  { title: 'Laboratory & Testing', description: 'CoA integrity, contaminant testing, method reliability, stability and lab due diligence concepts.', href: '/professionals' },
  { title: 'Pharmacovigilance & Safety', description: 'Product complaints, adverse event concepts, recall readiness, post-market surveillance and safety signals.', href: '/education' },
]

export const policyModules: ModuleItem[] = [
  { title: 'Regulatory Observatory', description: 'A structured home for policy movement, licensing model comparisons and reviewed regulatory change context.', href: '/policy-standards' },
  { title: 'Standards Library', description: 'Checklists and explainers for documentation, quality, procurement, product safety and responsible market conduct.', href: '/policy-standards' },
  { title: 'Public-Health Safeguards', description: 'Diversion prevention, patient-safety context, market conduct principles and controlled-access safeguards.', href: '/policy-standards' },
  { title: 'Licensing Models', description: 'Comparative education on medical access, importer, distributor, pharmacy and cultivation models.', href: '/policy-standards' },
  { title: 'Market Conduct', description: 'Responsible commercialization, conflict controls, advertising caution and institutional conduct principles.', href: '/policy-standards' },
  { title: 'Product Safety & Recall', description: 'Recall readiness education, batch traceability, withdrawal pathways and field safety communication concepts.', href: '/policy-standards' },
]

export const assessmentModules: ModuleItem[] = [
  { title: 'Country Pathway Assessment', description: 'A reviewed request path for assessing country-level route feasibility and access considerations.', href: '/assessments' },
  { title: 'Export Readiness', description: 'A commercial readiness review for companies seeking international market access.', href: '/assessments' },
  { title: 'Importer Readiness', description: 'A review path for importer, distributor and intake preparedness.', href: '/assessments' },
  { title: 'Supplier Documentation', description: 'A structured review of supplier documentation, quality materials and commercial readiness.', href: '/assessments' },
  { title: 'Documentation Review', description: 'A structured review of documentation, quality evidence and commercial readiness.', href: '/assessments' },
  { title: 'Counterparty Fit', description: 'A controlled request path for assessing role fit, seriousness and route compatibility.', href: '/assessments' },
  { title: 'Due Diligence Readiness', description: 'A readiness pathway for investors, acquirers and operators preparing institutional review materials.', href: '/assessments' },
]

export const trustModules: ModuleItem[] = [
  { title: 'Editorial Review', description: 'Reviewed publication standards, topic ownership, update discipline and correction handling.', href: '/trust-governance' },
  { title: 'Source Standards', description: 'Source discipline, confidence language and separation of public summaries from private materials.', href: '/source-methodology' },
  { title: 'Data Governance', description: 'Commercial sensitivity rules, access controls, document retention principles and audit trail framing.', href: '/trust-governance' },
  { title: 'Confidentiality Model', description: 'Controlled handling for counterparties, private inquiries, assessment submissions and introduction pathways.', href: '/reviewed-connections' },
  { title: 'Product Safety', description: 'Product complaint concepts, batch traceability, recall readiness and post-market safety education.', href: '/policy-standards' },
  { title: 'Credentialing Roadmap', description: 'Reviewer governance, completion records and future institutional education partnership pathways without premature accreditation claims.', href: '/institutional-partnerships' },
]

const exchangeModules: ModuleItem[] = [
  { title: 'Compliant Supply', description: 'Licensed cannabis inventory — supply submissions and buyer routing handled through reviewed private workflows.', href: '/marketplace/listings' },
  { title: 'Wanted Requests', description: 'Post what you need. Harbourview routes qualified seller responses through a reviewed workflow.', href: '/marketplace/wanted' },
  { title: 'Export-Ready Products', description: 'Seller and exporter orientation before documentation and route review.', href: '/marketplace/sell' },
  { title: 'Equipment & Infrastructure', description: 'Cultivation, processing, post-harvest, facility and automation equipment categories.', href: '/marketplace/services' },
  { title: 'Consumables & Operating Supplies', description: 'Packaging, lab, cultivation, logistics and operating supply categories.', href: '/marketplace/consumables' },
  { title: 'Services, Labs & Logistics', description: 'Professional and operating service categories for qualified commercial routing.', href: '/marketplace/services' },
  { title: 'Genetics, Seeds & Tissue Culture', description: 'Compliance-gated orientation for genetics and propagation categories.', href: '/marketplace/genetics' },
  { title: 'Distressed Inventory, Equipment, Facilities & Businesses', description: 'Confidential-first handling for distressed assets and acquisition opportunities.', href: '/marketplace/business-opportunities' },
]

const professionalModules: ModuleItem[] = [
  { title: 'Clinicians & Doctors', description: 'Non-promotional clinical education and professional context.', href: '/education' },
  { title: 'Pharmacists', description: 'Dispensing, handling, compliance and supply-chain education pathways.', href: '/education' },
  { title: 'Lawyers & Compliance Advisors', description: 'Market, policy, standards and client-readiness intelligence surfaces.', href: '/professionals' },
  { title: 'QA, GMP & Laboratory Professionals', description: 'Quality, documentation, testing and audit-readiness orientation.', href: '/education' },
  { title: 'Regulators & Policymakers', description: 'Neutral policy, source methodology and institutional collaboration paths.', href: '/policy-standards' },
  { title: 'Investors & Acquirers', description: 'Distressed assets, due diligence readiness and protected opportunity review.', href: '/marketplace/business-opportunities' },
  { title: 'Researchers, Educators & Advocates', description: 'History, policy, public literacy and institutional collaboration pathways.', href: '/institutional-partnerships' },
]

export const hubPages: Record<string, InstitutionalPageContent> = {
  platform: {
    eyebrow: 'Platform map',
    title: 'The Harbourview Platform — how everything connects.',
    description:
      'Nine interconnected pillars covering every dimension of serious regulated cannabis commercial engagement — from country intelligence and reviewed marketplace listings to professional pathways and controlled introductions.',
    primaryCta: { label: 'Browse the marketplace', href: '/marketplace' },
    secondaryCta: { label: 'Start a confidential conversation', href: '/intake' },
    boundary: PUBLIC_PRIVATE_BOUNDARY,
    sections: [
      {
        title: 'What each section does',
        description: 'Each pillar is public-safe and routes toward reviewed workflows where sensitive detail is involved.',
        items: [
          { title: 'Network', description: 'Role-specific entry points for every type of serious participant — operators, buyers, exporters, importers, professionals and institutions.', href: '/network' },
          { title: 'Exchange', description: 'A controlled commercial exchange for reviewed listings, wanted requests, surplus equipment, services and market-specific opportunities.', href: '/marketplace' },
          { title: 'Intelligence', description: 'Reviewed regional intelligence covering country pathway status, regulatory signals and commercial timing context across global markets.', href: '/intelligence' },
          { title: 'Source Methodology', description: 'How Harbourview intelligence is sourced, reviewed, and bounded — public transparency on evidence discipline.', href: '/source-methodology' },
          { title: 'Markets', description: 'Country-level orientation for import and export pathways, access models, and jurisdiction-specific commercial context.', href: '/markets' },
          { title: 'Education', description: 'Structured education for cannabis industry professionals — GMP, clinical access, pharmacy, compliance, cultivation and regulatory frameworks.', href: '/education' },
          { title: 'Professionals', description: 'Dedicated pathways for clinicians, pharmacists, regulatory professionals, compliance teams, investors and institutional participants.', href: '/professionals' },
          { title: 'Trust & Governance', description: 'How verification, confidentiality, and marketplace conduct standards are maintained across Harbourview.', href: '/trust-governance' },
          { title: 'Reviewed Connections', description: 'Reviewed introductions for qualified counterparties — exporters, importers, equipment buyers and strategic partners, handled privately.', href: '/reviewed-connections' },
        ],
      },
    ],
  },
  network: {
    eyebrow: 'Controlled commercial network',
    title: 'Find your role. We\'ll route the rest.',
    description:
      'Harbourview Network routes different types of serious participants to the commercial pathways, intelligence, and connections that are relevant to their role.',
    primaryCta: { label: 'Browse the marketplace', href: '/marketplace' },
    secondaryCta: { label: 'Apply for access', href: '/intake' },
    boundary: PUBLIC_PRIVATE_BOUNDARY,
    sections: [
      {
        title: 'Entry points by role',
        description: 'Public discovery stays controlled while sensitive routing is handled through reviewed inquiry workflows.',
        items: [
          { title: 'Operators & Cultivators', description: 'Access equipment sourcing, compliance education, service providers, and reviewed commercial connection pathways relevant to licensed cannabis operators and cultivators.', href: '/marketplace/services' },
          { title: 'Buyers & Procurement Teams', description: 'Post what you\'re looking to buy, browse available supply, and receive qualified seller routing through Harbourview review.', href: '/marketplace/wanted' },
          { title: 'Sellers & Exporters', description: 'Submit available products or supply, assess export readiness, and access importer and distributor matching pathways through reviewed commercial routing.', href: '/marketplace/sell' },
          { title: 'Importers & Distributors', description: 'Access country pathway context, supply matching, and counterparty review pathways for regulated cannabis importers and licensed distributors.', href: '/markets' },
          { title: 'Professionals & Institutions', description: 'Dedicated entry points for clinicians, pharmacists, regulatory professionals, compliance teams, industry associations, and research institutions.', href: '/professionals' },
          { title: 'Investors & Acquirers', description: 'Access distressed asset listings, business opportunity pipelines, and diligence-readiness review pathways for cannabis industry investors and acquirers.', href: '/marketplace/business-opportunities' },
        ],
      },
    ],
  },
  exchange: {
    eyebrow: 'Commercial exchange',
    title: 'Exchange & Marketplace',
    description:
      'The reviewed commercial layer for compliant supply, demand, equipment, infrastructure, consumables, services, genetics, logistics, labs, distressed assets and business opportunities.',
    primaryCta: { label: 'Submit Opportunity', href: '/marketplace/sell' },
    secondaryCta: { label: 'Create Wanted Request', href: '/marketplace/wanted' },
    boundary: PUBLIC_PRIVATE_BOUNDARY,
    sections: [
      {
        title: 'Exchange categories',
        description: 'Every category is a public-safe entry point; sensitive details require review before disclosure or routing.',
        items: exchangeModules,
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
        description: 'Public pages describe opportunity types while sensitive parties, terms and route details remain private.',
        items: [
          { title: 'Country Access', description: 'Potential market-entry openings and country-specific access pathways requiring review.', href: '/markets' },
          { title: 'Distribution Mandates', description: 'Reviewed distributor, importer and commercial channel opportunities.', href: '/marketplace/business-opportunities' },
          { title: 'Strategic Partnerships', description: 'Operator, service, clinical, research and institutional collaboration pathways.', href: '/institutional-partnerships' },
          { title: 'Asset & Business Packages', description: 'Facility, surplus, bulk, operational and business opportunity categories handled with discretion.', href: '/marketplace/business-opportunities' },
        ],
      },
    ],
  },
  intelligence: {
    eyebrow: 'Country, pathway and counterparty context',
    title: 'Intelligence',
    description:
      'Reviewed country, licensing, regulatory, category, counterparty and trade-route context for disciplined market access.',
    primaryCta: { label: 'Request a country brief', href: '/contact' },
    secondaryCta: { label: 'Explore Country Briefs', href: '/intelligence/country-briefs' },
    boundary: 'Public intelligence is high-level and reviewed as available. Harbourview does not publish sensitive source materials, private counterparty details or confidential commercial route information publicly.',
    sections: [
      {
        title: 'Intelligence modules',
        description: 'Public modules establish structure and request paths while deeper analyst material remains private.',
        items: intelligenceModules,
      },
    ],
  },
  sourceMethodology: {
    eyebrow: 'Source engine methodology',
    title: 'Source Methodology',
    description:
      'Public-safe explanation of Harbourview source classes, review discipline, confidence language, local-language monitoring, correction handling and private evidence boundaries.',
    primaryCta: { label: 'Request a country brief', href: '/contact' },
    secondaryCta: { label: 'Review Intelligence', href: '/intelligence' },
    boundary: 'Source methodology pages explain process only. Raw source captures, internal evidence records, analyst notes, counterparty intelligence and route-sensitive material are not public content.',
    sections: [
      {
        title: 'Source discipline',
        description: 'This page explains the public-facing method without exposing sensitive collection material or internal review systems.',
        items: [
          { title: 'Official and Primary Sources', description: 'Regulators, gazettes, licensing bodies, courts, customs, ministries and official registries where available.' },
          { title: 'Local-Language Monitoring', description: 'Market movement is tracked beyond English-language news where source quality and review capacity support it.' },
          { title: 'Confidence Tiers', description: 'Public language separates confirmed facts, reviewed interpretation, weak signals and items requiring local verification.' },
          { title: 'Evidence Boundaries', description: 'Public summaries do not expose raw source evidence, source URLs requiring review, internal notes or counterparty materials.' },
          { title: 'Correction Policy', description: 'Claims are constrained, reviewed and correctable when better public evidence becomes available.' },
        ],
      },
    ],
  },
  markets: {
    eyebrow: 'Jurisdiction hubs',
    title: 'Regulated cannabis markets — country status, pathways, and access conditions.',
    description:
      'Country-level orientation for import and export pathways, access model status, opportunity categories and regulatory signals across global regulated cannabis markets. Market pages provide public-safe context only — detailed country briefs and route reviews are available through controlled requests.',
    primaryCta: { label: 'Request a country brief', href: '/contact' },
    secondaryCta: { label: 'Track a Market', href: '/intelligence/country-briefs' },
    boundary: 'Market pages provide orientation context only. They do not confirm licensing eligibility, import clearance, transaction terms, or legal/regulatory outcomes. Detailed country reviews and route assessments are handled through controlled private requests.',
    sections: [
      {
        title: 'Market orientation surfaces',
        description: 'Each surface routes toward reviewed workflows for deeper country, route and commercial context.',
        items: [
          { title: 'Country Status', description: 'Country access model, regulatory maturity, and pathway status. Understand where a market sits before committing to entry.', href: '/intelligence/country-briefs' },
          { title: 'Import & Export Pathways', description: 'High-level import and export pathway context — authorization frameworks, GMP requirements, permit pathways and cross-border controls.', href: '/compliance' },
          { title: 'Opportunity Categories', description: 'Active opportunity categories by market — supply, demand, distribution mandates, service needs and equipment requirements filtered by jurisdiction.', href: '/marketplace' },
          { title: 'Signals', description: 'Policy and regulatory change monitoring for cannabis markets — licensing, prescription access, enforcement, and trade rule updates.', href: '/signals' },
        ],
      },
    ],
  },
  education: {
    eyebrow: 'Professional education',
    title: 'Education',
    description:
      'Non-promotional professional education for compliance, pharmaceutical cannabis, clinical and pharmacy stakeholders, cultivation, post-harvest, processing, GMP, GACP, GDP, import/export, law, policy, history and advocacy.',
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
  professionals: {
    eyebrow: 'Professional network',
    title: 'Professionals',
    description:
      'Role-specific public entry points for doctors, clinicians, pharmacists, lawyers, compliance advisors, QA and GMP professionals, researchers, policymakers, regulators, educators, advocates, investors and associations.',
    primaryCta: { label: 'Apply for access', href: '/intake' },
    secondaryCta: { label: 'Explore Education', href: '/education' },
    boundary: 'Professional pages provide routing and education context only. They do not provide medical, legal, investment, regulatory or compliance advice.',
    sections: [
      {
        title: 'Professional paths',
        description: 'Each role path routes to public-safe resources or reviewed private workflows as appropriate.',
        items: professionalModules,
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
        description: 'The policy layer is neutral, comparative and source-led. It does not imply government endorsement.',
        items: policyModules,
      },
    ],
  },
  assessments: {
    eyebrow: 'Readiness and feasibility',
    title: 'Assessments',
    description:
      'Controlled intake pathways for assessing market-access readiness, country-route feasibility, documentation, counterparty fit and due diligence preparedness.',
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
  reviewedConnections: {
    eyebrow: 'Reviewed connections',
    title: 'Reviewed Connections',
    description:
      'A protected-routing layer for qualified introductions, buyer/seller matching, exporter/importer review, equipment sourcing, distressed asset access and confidential dealroom orientation.',
    primaryCta: { label: 'Request Introduction', href: '/intake' },
    secondaryCta: { label: 'Contact Harbourview', href: '/contact' },
    boundary: `Introductions, dealroom access, asset disclosure and counterparty routing are never automatic. ${INTAKE_REVIEW_GATING_TEXT}`,
    sections: [
      {
        title: 'Connection workflows',
        description: `Public pages explain available pathways without exposing confidential counterparties, assets or terms. ${MARKETPLACE_CONFIDENTIALITY_CAVEAT}`,
        items: [
          { title: 'Buyer/Seller Matching', description: 'Supply and demand are reviewed before any introduction or private detail is shared.', href: '/marketplace/wanted' },
          { title: 'Exporter/Importer Review', description: 'Route feasibility, jurisdiction context and participant fit are reviewed before routing.', href: '/markets' },
          { title: 'Equipment Sourcing', description: 'Equipment, infrastructure and service needs route through reviewed inquiry paths.', href: '/marketplace/services' },
          { title: 'Distressed Asset Access', description: 'Inventory, equipment, facilities and businesses begin with confidential intake and qualification.', href: '/marketplace/business-opportunities' },
          { title: 'Protected Dealroom Orientation', description: 'Sensitive documents and terms remain outside public pages and require reviewed access.' },
        ],
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
          { title: 'Regulator Resources', description: 'Neutral resources for policy comparison, safeguards, access models and market conduct.', href: '/policy-standards' },
          { title: 'Association Collaboration', description: 'Structured education and standards collaboration with industry and professional bodies.', href: '/institutional-partnerships' },
          { title: 'Research Collaboration', description: 'University, clinical and source-focused collaboration pathways.', href: '/institutional-partnerships' },
          { title: 'Lab, Logistics & Standards', description: 'Partnership pathways for testing, quality, trade route and standards stakeholders.', href: '/professionals' },
        ],
      },
    ],
  },
  trust: {
    eyebrow: 'Trust, safety and governance',
    title: 'Trust, Safety & Governance',
    description:
      'A formal platform layer for claim discipline, source review, confidentiality, publication standards, product safety principles and controlled information handling.',
    primaryCta: { label: 'Contact Harbourview', href: '/contact' },
    secondaryCta: { label: 'Review Source Methodology', href: '/source-methodology' },
    boundary: 'Sensitive commercial information, source materials, analyst notes and counterparty identities are handled through controlled private workflows and are not intended for public display.',
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
    title: 'Platform',
    links: [
      { label: 'Platform Map', href: '/platform' },
      { label: 'Network', href: '/network' },
      { label: 'Reviewed Connections', href: '/reviewed-connections' },
      { label: 'Professionals', href: '/professionals' },
      { label: 'Trust & Governance', href: '/trust-governance' },
    ],
  },
  {
    title: 'Exchange',
    links: [
      { label: 'Exchange Home', href: '/marketplace' },
      { label: 'Reviewed Listings', href: '/marketplace/listings' },
      { label: 'Wanted Requests', href: '/marketplace/wanted' },
      { label: 'Submit Listing', href: '/marketplace/sell' },
      { label: 'Services & Equipment', href: '/marketplace/services' },
      { label: 'Distressed Assets', href: '/marketplace/business-opportunities' },
    ],
  },
  {
    title: 'Opportunities',
    links: [
      { label: 'Commercial Opportunities', href: '/opportunities' },
      { label: 'Country Access', href: '/markets' },
      { label: 'Distribution Mandates', href: '/marketplace/business-opportunities' },
      { label: 'Strategic Partnerships', href: '/institutional-partnerships' },
      { label: 'Submit Opportunity', href: '/marketplace/sell' },
    ],
  },
  {
    title: 'Intelligence',
    links: [
      { label: 'Intelligence Home', href: '/intelligence' },
      { label: 'Markets', href: '/markets' },
      { label: 'Signals', href: '/signals' },
      { label: 'Source Methodology', href: '/source-methodology' },
      ...intelligenceModules.map((item) => ({ label: item.title, href: item.href ?? '/intelligence' })),
    ],
  },
  {
    title: 'Education',
    links: educationTracks.map((item) => ({ label: item.title, href: item.href ?? '/education' })),
  },
  {
    title: 'Policy & Standards',
    links: policyModules.map((item) => ({ label: item.title, href: item.href ?? '/policy-standards' })),
  },
  {
    title: 'Assessments',
    links: assessmentModules.map((item) => ({ label: item.title, href: item.href ?? '/assessments' })),
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
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Start a confidential conversation', href: '/contact' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
    ],
  },
]
