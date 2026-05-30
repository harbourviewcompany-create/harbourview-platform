// ─────────────────────────────────────────────────────────────────────────────
// data/harbourview/country-intelligence.ts
// Per-country regulatory intelligence registry.
// Section pages fall back to state-derived generic copy when a slug is absent.
// ─────────────────────────────────────────────────────────────────────────────

export type MarketIntelligence = {
  frameworkLabel:  string   // short label for posture hero h1
  frameworkDetail: string   // 1–2 sentence framework description
  importLabel:     string   // short label for import card
  importDetail:    string   // specific import pathway detail
  operatorLabel:   string   // short label for operator card
  operatorDetail:  string   // operator landscape
  regulatorLabel:  string   // regulator name/acronym
  regulatorDetail: string   // regulator role + jurisdiction
}

export type ComplianceRequirement = {
  label:  string
  status: 'met' | 'gated' | 'unavailable'
  detail: string
}

export type ComplianceIntelligence = {
  headline:     string
  subline:      string
  importNote:   string
  certNote:     string
  requirements: ComplianceRequirement[]
}

export type SignalEntry = {
  tag:       string
  headline:  string
  date:      string
  tone:      'green' | 'gold' | 'blue' | 'amber' | 'red'
  category:  'regulatory' | 'market' | 'trade' | 'policy'
}

export type SignalsIntelligence = {
  feedSignals: SignalEntry[]
  sourceNote:  string
}

export type CountryIntelligenceProfile = {
  slug:        string
  lastReviewed: string
  market?:     MarketIntelligence
  compliance?: ComplianceIntelligence
  signals?:    SignalsIntelligence
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const registry: CountryIntelligenceProfile[] = [

  // ── GERMANY ─────────────────────────────────────────────────────────────────
  {
    slug: 'germany',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical + Adult-Use (CanG 2024)',
      frameworkDetail: 'Germany operates a dual-track framework: a GKV-reimbursable medical pathway under SGB V §31 (active since 2017), and a limited adult-use regime under the Cannabis Act 2024 (CanG), which permits personal possession, home cultivation, and registered Cannabis Social Clubs (CSCs).',
      importLabel:     'BtM import permit (BfArM) — per shipment',
      importDetail:    'Importers require a §3 BtMG import licence (Einfuhrerlaubnis) and must obtain a per-shipment Betäubungsmittel Einfuhrgenehmigung via the BfArM NARCOS portal. WDA (Wholesale Distribution Authorisation) and GDP compliance are mandatory for all distributors.',
      operatorLabel:   'Licensed multi-operator market (WDA required)',
      operatorDetail:  'Active multi-operator distribution network including Demecan, Cantourage, IMC Germany, Aurora Cannabis Deutschland, Tilray, and others. Domestic cultivation licensed under BtMG §3 for a small cohort of operators; BfArM tender for regulated domestic supply ongoing.',
      regulatorLabel:  'BfArM (Federal Institute for Drugs and Medical Devices)',
      regulatorDetail: 'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte) is the primary competent authority for narcotic import permits, domestic cultivation licences, and product authorisation. GKV reimbursement decisions sit with the Joint Federal Committee (G-BA) and individual health insurers.',
    },
    compliance: {
      headline:   'Comprehensive BtMG compliance framework',
      subline:    'EU-GMP certification, per-shipment BtM import permits, GDP-compliant distribution, and strict labelling standards are all mandatory. BfArM enforces via NARCOS permit system and WDA inspection regime.',
      importNote: 'Each shipment requires a BtM Einfuhrgenehmigung issued by BfArM via the NARCOS portal. Applications require: EU-GMP certificate covering the specific site and SKU, exporter licence from the country of origin, WDA of the receiving German entity, and detailed product information. Processing typically 2–4 weeks.',
      certNote:   'EU-GMP certificate (from EMA/national authority) is mandatory and must cover the specific manufacturing site and product SKU. Health Canada, TGA, and select other GMP certifications are accepted under bilateral recognition. GDP (Good Distribution Practice) certification required for WDA holders.',
      requirements: [
        { label: 'EU-GMP certification',          status: 'met',   detail: 'Mandatory for all imported cannabis medicines. Certificate must be site-specific and SKU-specific. Issued by EMA or national competent authority of the producing country.' },
        { label: 'BtM Einfuhrgenehmigung',         status: 'met',   detail: 'Per-shipment import permit from BfArM via NARCOS portal. Required for all Schedule I narcotics including cannabis flower, extracts, and oils.' },
        { label: 'Importer §3 BtMG licence',       status: 'met',   detail: 'Einfuhrerlaubnis under BtMG §3 required for the importing entity. Annual renewal; BfArM inspection required before initial issuance.' },
        { label: 'WDA / GDP certification',        status: 'met',   detail: 'Wholesale Distribution Authorisation and GDP compliance required for all distributor entities. Issued by state (Länder) authority.' },
        { label: 'Product labelling (BtMG §10)',   status: 'met',   detail: 'Labelling must include active ingredient (THC/CBD mg), batch number, manufacturer, expiry, and GMP certificate reference. German-language labels required for end-product dispensed in DE.' },
        { label: 'Child-resistant packaging',      status: 'met',   detail: 'Child-resistant, tamper-evident, opaque packaging mandatory. Specific packaging standards per product form (flower, extract, oil).' },
        { label: 'Certificate of Analysis (CoA)', status: 'met',   detail: 'Accredited lab CoA required per batch covering potency, residual solvents, pesticides, heavy metals, and microbials. Lab must be ISO/IEC 17025 accredited.' },
        { label: 'Batch traceability (BtMG §13)',  status: 'met',   detail: 'Full batch traceability from cultivation to pharmacy dispensing is legally required. BtM circulation records (Karteikarte) maintained by all WDA holders.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Policy',     headline: 'CanG Social Club (CSC) regulations finalised — licensing open in 12 states', date: 'May 2026', tone: 'blue',  category: 'policy' },
        { tag: 'Market',     headline: 'BfArM NARCOS portal processing times reduced to 10 business days following system upgrade', date: 'Apr 2026', tone: 'green', category: 'market' },
        { tag: 'Regulatory', headline: 'G-BA confirms GKV reimbursement extension to 14 additional THC-dominant formulations', date: 'Apr 2026', tone: 'green', category: 'regulatory' },
        { tag: 'Trade',      headline: 'Domestic BfArM cultivation tender second-round results expected Q3 2026', date: 'Mar 2026', tone: 'gold',  category: 'trade' },
        { tag: 'Market',     headline: 'German prescription volumes reach estimated 3.2M DDD/month — 42% YoY growth', date: 'Mar 2026', tone: 'blue',  category: 'market' },
      ],
      sourceNote: 'Signals sourced from BfArM bulletin publications, Bundesanzeiger legislative filings, GKV-Spitzenverband releases, and Harbourview operator network. Regulatory signals are event-driven; market signals are reviewed monthly.',
    },
  },

  // ── FRANCE ──────────────────────────────────────────────────────────────────
  {
    slug: 'france',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access — post-experiment transition (ANSM)',
      frameworkDetail: 'France completed its supervised medical cannabis experiment (March 2021–March 2024, ~11,000 enrolled patients) and is transitioning to a permanent access framework under ANSM oversight. Products access the market via the Accès Précoce (AAP) pathway pending full AMM approvals, with named-patient import remaining the primary supply channel in the near term.',
      importLabel:     'ANSM narcotics import authorisation (named-patient)',
      importDetail:    'Import requires ANSM narcotics authorisation under the cadre de l\'accès précoce. Named-patient supply through Centres de Référence (reference centres). EU-GMP mandatory for all product. ANSM is developing a standardised AMM import pathway as the permanent framework is finalised.',
      operatorLabel:   'Restricted prescriber network — Centre de Référence model',
      operatorDetail:  'Prescriptions are issued by specialist physicians (neurology, oncology, pain medicine, palliative care) within designated Centres de Référence. Distribution is through hospital pharmacies and select retail pharmacies enrolled in the experiment transition programme. Commercial distribution to expand under permanent framework.',
      regulatorLabel:  'ANSM (Agence nationale de sécurité du médicament)',
      regulatorDetail: 'ANSM (Agence nationale de sécurité du médicament et des produits de santé) is the primary competent authority for cannabis product authorisation, import permits, and prescriber programme governance. ANSM publishes regular evaluation reports on the experiment transition.',
    },
    compliance: {
      headline:   'Transitional compliance — ANSM import authorisation required',
      subline:    'EU-GMP is mandatory for all product. ANSM narcotics import authorisation is required per supply agreement. The permanent AMM pathway is under development; compliance requirements will formalise as framework legislation advances.',
      importNote: 'ANSM narcotics import authorisation required. Currently processed under the Accès Précoce framework; expects alignment with EU common technical document (CTD) submission process as permanent AMM pathway advances. French-language labelling will be mandatory for final dispensed product.',
      certNote:   'EU-GMP certification mandatory — certificate must be current and cover the specific manufacturing site and product. ANSM has accepted certificates from EMA, MHRA, Health Canada, and TGA for import submissions during the experiment phase.',
      requirements: [
        { label: 'EU-GMP certification',          status: 'met',   detail: 'Mandatory for all imported cannabis medicines under the experiment transition and AAP framework. ANSM-accepted equivalents include MHRA, Health Canada, and TGA GMP certificates.' },
        { label: 'ANSM narcotics import permit',  status: 'met',   detail: 'Per-supply-agreement import authorisation from ANSM. Processing timelines are variable during the transition period; 4–8 weeks typical.' },
        { label: 'Product labelling (French)',    status: 'met',   detail: 'French-language labelling required for all product dispensed to French patients. THC/CBD content, batch, expiry, manufacturer, and prescribing indication must appear.' },
        { label: 'Packaging requirements',        status: 'gated', detail: 'Standards for the permanent framework are not yet finalised. Experiment-phase requirements align with EU norms; final rules expected in permanent framework legislation.' },
        { label: 'Prescriber authorisation',      status: 'met',   detail: 'Prescription restricted to specialist physicians in enrolled Centres de Référence. Prescriber training completion required prior to first prescription.' },
        { label: 'Analytical testing (CoA)',      status: 'met',   detail: 'Full CoA required per batch — potency, residual solvents, pesticides, heavy metals, and microbials. Lab must meet EU Pharmacopoeia or equivalent standards.' },
        { label: 'Batch traceability',            status: 'met',   detail: 'Required under ANSM authorisation conditions. Chain-of-custody documentation from manufacturing site to dispensing pharmacy is mandatory.' },
        { label: 'AMM / market authorisation',    status: 'gated', detail: 'No cannabis product currently holds a full French AMM. First AMM submissions are expected under the permanent framework. Products currently supplied under AAP (Accès Précoce) designation.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Regulatory', headline: 'ANSM publishes final evaluation report on experiment — 77% patient satisfaction, 92% symptom improvement', date: 'Apr 2026', tone: 'green', category: 'regulatory' },
        { tag: 'Policy',     headline: 'Permanent framework legislation enters Assemblée Nationale reading — vote expected H2 2026', date: 'Apr 2026', tone: 'gold',  category: 'policy' },
        { tag: 'Market',     headline: 'ANSM opens first AMM pre-submission consultation window for cannabis-based medicines', date: 'Mar 2026', tone: 'blue',  category: 'market' },
        { tag: 'Trade',      headline: 'French hospital pharmacy group (AGEPS) issues supply tender for post-experiment transition period', date: 'Mar 2026', tone: 'gold',  category: 'trade' },
        { tag: 'Policy',     headline: 'Centre de Référence network expanded to 39 sites nationwide for transition access period', date: 'Feb 2026', tone: 'blue',  category: 'policy' },
      ],
      sourceNote: 'Signals sourced from ANSM official publications, Journal Officiel de la République Française, Assemblée Nationale legislative tracker, and Harbourview analyst network. Post-experiment transition is a high-signal period; monitoring at weekly cadence.',
    },
  },

  // ── AUSTRALIA ───────────────────────────────────────────────────────────────
  {
    slug: 'australia',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access — TGA/ODC dual-authority framework',
      frameworkDetail: 'Australia operates a dual-authority medical cannabis framework: the TGA (Therapeutic Goods Administration) governs product scheduling and approval, while the ODC (Office of Drug Control) issues cultivation, manufacture, and import licences. Three prescriber pathways are available: SAS Category A (terminal/serious conditions), SAS Category B (standard medical access), and Authorised Prescriber (AP, for high-volume prescribers). Schedule 4 (CBD) and Schedule 8 (THC-containing) products follow different regulatory tracks.',
      importLabel:     'ODC import licence per consignment (routine)',
      importDetail:    'Each importation requires an ODC import licence (Narcotic Drugs Act 1967). ODC processes approximately 100–120 import licences per month. TGA-equivalent GMP (EU-GMP, Health Canada, US-FDA) is accepted via mutual recognition. ODC publishes import data quarterly.',
      operatorLabel:   'Multi-operator import + domestic production market',
      operatorDetail:  'Approximately 30 licensed domestic cultivators/manufacturers including Cann Group, Botanical Food Company, and Little Green Pharma. Active import market led by Montu (Alternaleaf), Cannatrek, Althea Group, and others. ~10,000+ Authorised Prescribers registered with TGA as of 2025.',
      regulatorLabel:  'TGA + ODC (dual authority)',
      regulatorDetail: 'TGA (part of the Department of Health and Aged Care) governs product scheduling, SAS approvals, and AP registration. ODC (part of the Department of Health and Aged Care) issues import, export, cultivation, and manufacture licences. Separate applications required to each authority.',
    },
    compliance: {
      headline:   'TGA/ODC dual-authority compliance — GMP + ODC import licence',
      subline:    'TGA-equivalent GMP certification and an ODC import licence are both required for each importation. Authorised Prescriber and SAS pathway paperwork is managed at the prescriber level; suppliers must maintain TGA-registered or SAS-eligible product status.',
      importNote: 'ODC import licence application required per consignment under the Narcotic Drugs Act 1967. Application includes: GMP certificate for manufacturing site, Certificate of Analysis for the batch, product description, importer details, and ODC licence number. Processing 10–15 business days. ODC registration for the importing entity required before first application.',
      certNote:   'TGA-equivalent GMP certification required. Accepted standards: EU-GMP (EMA/national authority), Health Canada GMP, US-FDA cGMP, TGA GMP (for domestic). Mutual recognition agreements cover major certified markets. Certificate must cover specific site and product type.',
      requirements: [
        { label: 'TGA-equivalent GMP',           status: 'met',   detail: 'Mandatory for all imported cannabis medicines. EU-GMP, Health Canada GMP, and US-FDA cGMP are accepted. TGA publishes a list of accepted certificates via the PIC/S mutual recognition framework.' },
        { label: 'ODC import licence',            status: 'met',   detail: 'Per-consignment ODC import licence under the Narcotic Drugs Act 1967. Importing entity must hold current ODC licence. Processing typically 10–15 business days.' },
        { label: 'TGA SAS/AP product listing',    status: 'met',   detail: 'Product must be listed on TGA\'s SAS Product Register or have an ARTG entry for AP prescriptions. SAS Category B approval is prescriber-managed; AP programme product listing is required.' },
        { label: 'Product labelling (TGA)',       status: 'met',   detail: 'English-language labels required. THC/CBD content, batch, expiry, manufacturer, warning statements, and Schedule designation (S4 or S8) must appear per TGA label standards.' },
        { label: 'Child-resistant packaging',     status: 'met',   detail: 'Child-resistant packaging mandatory under Poisons Standard for Schedule 8 products. Standard consumer packaging rules apply.' },
        { label: 'Certificate of Analysis',       status: 'met',   detail: 'Per-batch CoA required covering potency, residual solvents, pesticides, heavy metals, microbials, and moisture. Lab must be NATA accredited or equivalent.' },
        { label: 'Batch traceability',            status: 'met',   detail: 'Full traceability from cultivation/manufacture to dispensing required. ODC record-keeping obligations apply to licence holders.' },
        { label: 'State/territory prescriber endorsement', status: 'gated', detail: 'Some states/territories (e.g. QLD, NSW) require prescriber endorsement or notification in addition to TGA AP/SAS status. Requirements vary by jurisdiction.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Market',     headline: 'TGA reports SAS Category B approvals exceed 750,000 cumulative — AP prescriber numbers reach 11,200', date: 'May 2026', tone: 'green', category: 'market' },
        { tag: 'Regulatory', headline: 'TGA commences consultation on potential Schedule 4 reclassification for additional CBD isolate products', date: 'Apr 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Market',     headline: 'ODC quarterly import data shows 118 import licences issued in Q1 2026 — import volumes up 28% YoY', date: 'Apr 2026', tone: 'blue',  category: 'market' },
        { tag: 'Trade',      headline: 'Domestic cultivator capacity expansion — Cann Group and Botanical Food Company announce combined 8-tonne facility upgrade', date: 'Mar 2026', tone: 'blue',  category: 'trade' },
        { tag: 'Regulatory', headline: 'TGA updates SAS Product Register processing timelines — Category B approvals now 72-hour target', date: 'Feb 2026', tone: 'green', category: 'regulatory' },
      ],
      sourceNote: 'Signals sourced from TGA official publications and SAS portal releases, ODC quarterly import data, Federal Register of Legislation, and Harbourview operator network. TGA and ODC are primary source feeds; monitored on event-driven and weekly cadence.',
    },
  },

  // ── UNITED KINGDOM ──────────────────────────────────────────────────────────
  {
    slug: 'united-kingdom',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access — Schedule 2, specialist prescription only',
      frameworkDetail: 'Cannabis-based products for medicinal use (CBPMs) were rescheduled from Schedule 1 to Schedule 2 of the Misuse of Drugs Regulations 2001 in November 2018. Prescribing is restricted to specialist consultants on the specialist register of the GMC. No NHS formulary pathway exists; the market operates entirely on private prescription. Home Office import/export licences are required for each consignment.',
      importLabel:     'Home Office Schedule 2 import licence — per consignment',
      importDetail:    'Each import consignment requires a Home Office Schedule 2 import licence (Misuse of Drugs Regulations 2001). Typical processing is 2–3 weeks. The importing entity must hold a valid controlled drug licence issued by the Home Office. MHRA-equivalent GMP is mandatory.',
      operatorLabel:   'Specialist pharmacy dispensing network (private Rx only)',
      operatorDetail:  'Dispensing is exclusively through specialist pharmacy networks — including Curaleaf UK, Lyphe Group, Celadon Pharmaceuticals dispensing arm, and others. No NHS formulary listing; out-of-pocket cost to patients typically £150–400/month. Prescriber base is growing, primarily in neurology, oncology, pain, and psychiatry.',
      regulatorLabel:  'MHRA + Home Office (dual authority)',
      regulatorDetail: 'MHRA (Medicines and Healthcare products Regulatory Agency) governs product standards, clinical evidence requirements, and import quality standards. The Home Office issues Schedule 2 controlled drug licences and per-consignment import/export permits. Separate authority relationships required.',
    },
    compliance: {
      headline:   'Schedule 2 compliance — Home Office licence + MHRA GMP',
      subline:    'Home Office Schedule 2 import licence per consignment and MHRA-equivalent GMP certification are both mandatory. No NHS pathway; compliance with specialist prescribing and specialist pharmacy dispensing protocols required.',
      importNote: 'Home Office import licence required per consignment under the Misuse of Drugs Regulations 2001. Application requires: MHRA-equivalent GMP certificate, CoA, product specification, exporter\'s controlled drug licence from country of origin, and consignee details. Processing 2–3 weeks; expedited processing available in limited circumstances.',
      certNote:   'MHRA-equivalent GMP certification required. Accepted standards include EU-GMP (post-Brexit MHRA continues to recognise), Health Canada GMP, and TGA GMP via mutual recognition. MHRA publishes an accepted GMP standard register. Site-specific and product-specific certificate required.',
      requirements: [
        { label: 'MHRA-equivalent GMP',          status: 'met',   detail: 'Required for all CBPMs. MHRA accepts EU-GMP, Health Canada GMP, and TGA GMP under current mutual recognition framework. Post-Brexit alignment with EU-GMP maintained in practice.' },
        { label: 'Home Office import licence',    status: 'met',   detail: 'Per-consignment Schedule 2 import licence from Home Office. Importing entity must hold a valid controlled drug licence. Processing 2–3 weeks.' },
        { label: 'Specialist prescriber (GMC)',   status: 'met',   detail: 'Prescription restricted to consultants on the GMC specialist register in a relevant specialty (neurology, oncology, pain, psychiatry, etc.). GPs cannot prescribe CBPMs.' },
        { label: 'Specialist pharmacy dispensing', status: 'met',  detail: 'Dispensing restricted to pharmacies with a controlled drug licence and specialist pharmacy designation. Standard community pharmacies cannot dispense CBPMs without special authorisation.' },
        { label: 'Product labelling (English)',   status: 'met',   detail: 'English-language labels mandatory. CBPM designation, THC/CBD content, batch, expiry, manufacturer, and Schedule 2 controlled drug warning must appear per MHRA standards.' },
        { label: 'Packaging requirements',        status: 'met',   detail: 'Child-resistant, opaque, tamper-evident packaging required for all Schedule 2 controlled drugs. MHRA guidance applies.' },
        { label: 'Certificate of Analysis',       status: 'met',   detail: 'Per-batch CoA required. UKAS-accredited or ISO/IEC 17025 equivalent lab required. Potency, residual solvents, pesticides, heavy metals, and microbials are standard.' },
        { label: 'NHS formulary / reimbursement', status: 'unavailable', detail: 'No NHS formulary pathway currently exists for CBPMs. All prescriptions are private. NICE has reviewed limited indications; broader NHS access pathway is not operative.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Regulatory', headline: 'MHRA issues updated CBPM manufacturer guidance — new stability data requirements for flower products', date: 'May 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Market',     headline: 'UK private CBPM prescription market reaches estimated 200,000 active patients — up 35% YoY', date: 'Apr 2026', tone: 'green', category: 'market' },
        { tag: 'Policy',     headline: 'NICE evidence review for CBPMs in treatment-resistant epilepsy and chronic pain enters stakeholder consultation', date: 'Mar 2026', tone: 'gold',  category: 'policy' },
        { tag: 'Trade',      headline: 'Home Office Home Office confirms post-Brexit Schedule 2 import processing time target of 15 business days maintained', date: 'Mar 2026', tone: 'blue',  category: 'trade' },
        { tag: 'Market',     headline: 'New specialist pharmacy network (Dispensary Green) launches — 45 clinic partnerships announced at launch', date: 'Feb 2026', tone: 'blue',  category: 'market' },
      ],
      sourceNote: 'Signals sourced from MHRA official publications, Home Office controlled drugs bulletins, NHS England treatment guidance releases, and Harbourview specialist pharmacy network. MHRA and Home Office are primary regulatory feeds; NICE guidance is tracked as a market-access signal.',
    },
  },

  // ── NETHERLANDS ─────────────────────────────────────────────────────────────
  {
    slug: 'netherlands',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access — OMC monopoly supply model',
      frameworkDetail: 'The Netherlands operates a state-supervised medical cannabis supply model via the Bureau voor Medicinale Cannabis (BMC/OMC), which controls cultivation contracts and supply chain standards. Bedrocan BV is the sole contracted cultivator for the OMC portfolio. Import of pharmaceutical-grade cannabis products not in the OMC portfolio is permitted under OMC authorisation. Any physician can prescribe; dispensing is through regular pharmacies.',
      importLabel:     'OMC import authorisation required (non-portfolio products)',
      importDetail:    'Import of cannabis products outside the OMC standard portfolio requires specific OMC import authorisation. EU-GMP and Netherlands Pharmacopoeia compliance are required. Import of OMC-portfolio products flows exclusively through Bedrocan; parallel import is not permitted for standard portfolio strains.',
      operatorLabel:   'OMC-contracted single cultivator (Bedrocan) + limited import',
      operatorDetail:  'Bedrocan BV holds the sole OMC cultivation and supply contract for the Netherlands domestic medical market. Specialty and novel product imports may be authorised separately by OMC. The Netherlands is also evaluating a regulated recreational market pilot which may reshape the operator landscape.',
      regulatorLabel:  'OMC / BMC (Bureau voor Medicinale Cannabis) + IGJ',
      regulatorDetail: 'The OMC (Office of Medicinal Cannabis, under the Ministry of Health) manages supply authorisations, product standards, and import/export permitting. IGJ (Inspectie Gezondheidszorg en Jeugd) governs pharmaceutical quality oversight. Both authorities must be engaged for market access.',
    },
    compliance: {
      headline:   'EU-GMP + Netherlands Pharmacopoeia — OMC supply authorisation',
      subline:    'EU-GMP is mandatory. Products for the standard OMC portfolio must meet Netherlands Pharmacopoeia (NF) monograph specifications. Import authorisation from OMC is required for non-portfolio products.',
      importNote: 'Non-portfolio products require specific OMC import authorisation. Application includes: EU-GMP certificate, CoA meeting OMC/NF specifications, product dossier, and batch-level documentation. OMC portfolio import flows exclusively through Bedrocan; no parallel import channel for standard strains.',
      certNote:   'EU-GMP certificate mandatory. Netherlands Pharmacopoeia (NF) compliance required for product specifications including potency, heavy metals, pesticides, and microbials — NF monograph is stricter than standard EU-GMP product release specifications in several areas.',
      requirements: [
        { label: 'EU-GMP certification',          status: 'met',   detail: 'Mandatory for all cannabis medicines supplied in the Netherlands. Issued by EMA or national authority. Must cover specific manufacturing site and product type.' },
        { label: 'Netherlands Pharmacopoeia (NF) compliance', status: 'met', detail: 'OMC portfolio products must meet NF monograph specifications for cannabis flos and extracts. NF limits for heavy metals and pesticides are stricter than standard EU-GMP release requirements.' },
        { label: 'OMC import authorisation',      status: 'gated', detail: 'Required for non-portfolio products. OMC evaluates applications against Dutch formulary needs and NF compliance. Lead time variable; 6–12 weeks typical.' },
        { label: 'Physician prescription',        status: 'met',   detail: 'Any licensed Dutch physician can prescribe. OMC products are available at any Dutch pharmacy without specialist referral.' },
        { label: 'Pharmacy dispensing',           status: 'met',   detail: 'Standard Dutch community pharmacies can dispense OMC products. Magistral preparation from OMC-supplied cannabis flos is common.' },
        { label: 'Product labelling',             status: 'met',   detail: 'Dutch-language labelling required for dispensed products. OMC product specifications define standard labelling elements.' },
        { label: 'Reimbursement (ZVW)',            status: 'gated', detail: 'Zorgverzekeringswet (basic health insurance) reimbursement for medicinal cannabis is limited and insurer-dependent. Some indication-specific reimbursement pathways exist but are not universally applied.' },
        { label: 'Recreational market compliance', status: 'gated', detail: 'The Netherlands is developing a regulated recreational market pilot. Compliance framework for recreational market access is under development and separate from the medical supply model.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Policy',     headline: 'Dutch government announces expansion of recreational market pilot to 12 municipalities — national rollout framework under review', date: 'May 2026', tone: 'blue',  category: 'policy' },
        { tag: 'Market',     headline: 'OMC reports 18% increase in medicinal cannabis prescriptions in 2025 — chronic pain indications leading growth', date: 'Apr 2026', tone: 'green', category: 'market' },
        { tag: 'Regulatory', headline: 'IGJ publishes updated GDP inspection focus areas for cannabis wholesale — traceability documentation under scrutiny', date: 'Mar 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Trade',      headline: 'Bedrocan announces new cannabis variety introduction for OMC portfolio — H1 2026 availability', date: 'Feb 2026', tone: 'blue',  category: 'trade' },
        { tag: 'Policy',     headline: 'ZVW reimbursement working group publishes interim report — recommendation for trial reimbursement in chronic pain', date: 'Jan 2026', tone: 'gold',  category: 'policy' },
      ],
      sourceNote: 'Signals sourced from OMC (Bureau voor Medicinale Cannabis) publications, IGJ inspection bulletins, Dutch government regulatory gazette (Staatscourant), and Harbourview operator network. OMC pilot programme developments are a primary monitoring focus.',
    },
  },

  // ── PORTUGAL ────────────────────────────────────────────────────────────────
  {
    slug: 'portugal',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access + EU GMP production hub (INFARMED)',
      frameworkDetail: 'Portugal operates a dual role in the EU cannabis ecosystem: as a medical access market under Law 33/2018 and Decree-Law 8/2019, and as a major GMP cultivation and processing hub for the broader EU supply chain. INFARMED governs both domestic patient access (primarily via magistral pharmacy preparations) and the export-licensed GMP producer network. Portugal\'s EU-GMP licensed operator base makes it a key origin point for product entering Germany, UK, Poland, and other EU markets.',
      importLabel:     'INFARMED narcotics import authorisation',
      importDetail:    'Domestic supply imports require INFARMED authorisation under the narcotics regulatory framework. In practice, the majority of product flowing through Portugal is for GMP processing and re-export to other EU markets; domestic patient volume is relatively small. INFARMED import authorisation lead time is typically 3–5 weeks.',
      operatorLabel:   'EU-GMP export-oriented operator base + limited domestic retail',
      operatorDetail:  'Multiple EU-GMP licensed operators active: Tilray Português (Cantanhede facility), Fotmer Life Sciences (Odemira), and several others. These operators primarily produce for export to Germany, UK, and other EU markets. Domestic patient access is limited; magistral preparation is the primary patient supply channel via INFARMED-authorised pharmacies.',
      regulatorLabel:  'INFARMED (Instituto Nacional da Farmácia e do Medicamento)',
      regulatorDetail: 'INFARMED (National Authority of Medicines and Health Products) governs all aspects of medical cannabis regulation in Portugal: cultivation and production licences, import/export authorisations, product approval, and pharmacy dispensing oversight. INFARMED maintains a publicly available register of licensed operators.',
    },
    compliance: {
      headline:   'EU-GMP mandatory — export production and domestic access both governed by INFARMED',
      subline:    'EU-GMP is mandatory for all licensed operators. Domestic patient access is via magistral pharmacy preparation under INFARMED oversight. Export compliance requirements mirror the destination country\'s import standards in addition to Portuguese production standards.',
      importNote: 'INFARMED narcotics import authorisation required for domestic patient supply. Import for GMP processing and re-export follows a separate INFARMED manufacturing licence pathway. EU-GMP is the baseline standard for all import and export operations.',
      certNote:   'EU-GMP certificate from INFARMED or reciprocal national authority required for all operations. Portugal-based GMP facilities are certified by INFARMED and their certificates are recognised across the EU under EMA/EDMF procedures. Export to non-EU markets may require additional destination-country GMP recognition.',
      requirements: [
        { label: 'INFARMED cultivation/production licence', status: 'met', detail: 'Required for all GMP cultivation and processing operators. INFARMED issues licences under Portaria 101/2019 and Decree-Law 8/2019. Annual renewal with inspection.' },
        { label: 'EU-GMP certification (INFARMED)',         status: 'met', detail: 'EU-GMP certificate issued by INFARMED following site inspection. Recognised across all EU member states and accepted in UK, Australia, and other major markets.' },
        { label: 'Export authorisation (INFARMED)',         status: 'met', detail: 'Per-consignment export authorisation from INFARMED required for product exported to EU and non-EU markets. Export certificate confirms GMP status and product specification compliance.' },
        { label: 'INFARMED import authorisation',           status: 'met', detail: 'Required for imported raw material used in GMP processing. Processing timeline 3–5 weeks; advance planning required for supply continuity.' },
        { label: 'Magistral preparation pharmacy auth.',    status: 'met', detail: 'Pharmacies dispensing magistral cannabis preparations require specific INFARMED authorisation. Standard pharmacy licence does not automatically include cannabis dispensing rights.' },
        { label: 'Patient prescription (physician)',        status: 'met', detail: 'Physician prescription required for patient access. Any licensed physician can prescribe; specialist referral not mandatory.' },
        { label: 'CoA and batch traceability',              status: 'met', detail: 'Full batch CoA and traceability documentation required by INFARMED for both domestic and export supply. INFARMED inspection covers batch records and traceability systems.' },
        { label: 'National reimbursement',                  status: 'gated', detail: 'SNS (Serviço Nacional de Saúde) reimbursement for medical cannabis is limited and indication-specific. Magistral preparation costs are generally borne by patients; some regional partial coverage exists.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Trade',      headline: 'INFARMED reports 14 active EU-GMP cannabis licences — Portugal remains largest EU producer by exported volume', date: 'May 2026', tone: 'green', category: 'trade' },
        { tag: 'Market',     headline: 'Fotmer Life Sciences secures €22M expansion capital — Phase 2 greenhouse capacity bringing total to 24 tonnes annual', date: 'Apr 2026', tone: 'blue',  category: 'market' },
        { tag: 'Regulatory', headline: 'INFARMED updates export authorisation guidelines — new CoA equivalency requirements for non-EU destination countries', date: 'Mar 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Trade',      headline: 'Tilray Português expands German supply agreement — estimated 6.5 tonnes/year supply commitment', date: 'Mar 2026', tone: 'green', category: 'trade' },
        { tag: 'Policy',     headline: 'Portuguese government announces review of SNS reimbursement eligibility for palliative care cannabis prescriptions', date: 'Feb 2026', tone: 'gold',  category: 'policy' },
      ],
      sourceNote: 'Signals sourced from INFARMED official publications, Diário da República (official gazette), licensed operator disclosures, and Harbourview GMP operator network. Portugal GMP export dynamics are a primary monitoring focus given supply chain relevance.',
    },
  },

  // ── ITALY ───────────────────────────────────────────────────────────────────
  {
    slug: 'italy',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access — AIFA / SCFM domestic production + import',
      frameworkDetail: 'Italy permits medical cannabis under DL 36/2014 and subsequent ministerial decrees. The Stabilimento Chimico Farmaceutico Militare (SCFM) in Florence holds a state monopoly on domestic cultivation; domestic supply capacity is limited, making import structurally necessary. AIFA (Agenzia Italiana del Farmaco) oversees import authorisations. Any physician can prescribe off-label via magistral preparation; a growing number of pharmacy compounding labs serves the patient market.',
      importLabel:     'AIFA import authorisation (routine — supply gap)',
      importDetail:    'AIFA routinely authorises cannabis imports to supplement inadequate domestic SCFM supply. Import authorisation is required per consignment. EU-GMP is mandatory. Major import suppliers include Tilray (under existing SCFM supply partnership), Aurora, and others. Import volume has increased significantly as domestic demand outpaces SCFM production.',
      operatorLabel:   'SCFM state monopoly (domestic) + multi-operator import market',
      operatorDetail:  'SCFM (Florence) is the sole licensed domestic cultivator; limited capacity creates systemic import dependency. Import is handled by licensed pharmaceutical distributors under AIFA authorisation. Magistral preparation by compounding pharmacies (farmacie galenica) is the primary patient access model. "Cannabis light" (low-THC hemp, <0.5% THC) is a separate and growing consumer market.',
      regulatorLabel:  'AIFA (Agenzia Italiana del Farmaco)',
      regulatorDetail: 'AIFA is the primary competent authority for medical cannabis import authorisations, product standards, and market access governance. The Ministry of Health (Ministero della Salute) oversees overall regulatory framework. SCFM operates under Ministry of Defence governance for domestic cultivation.',
    },
    compliance: {
      headline:   'AIFA import authorisation + EU-GMP — magistral preparation model',
      subline:    'EU-GMP is mandatory for all imported product. AIFA import authorisation is required per consignment. Magistral preparation via compounding pharmacies is the dominant patient access channel; standard pharmacy dispensing of finished products is limited.',
      importNote: 'AIFA import authorisation required per consignment. Application includes: EU-GMP certificate, CoA, product description, and licensed importer details. AIFA processes applications under the narcotics import framework; lead time typically 3–6 weeks. Import dependency is structural given SCFM\'s limited domestic capacity.',
      certNote:   'EU-GMP certification mandatory for all imported product. AIFA recognises certificates from EMA, MHRA, Health Canada, TGA, and other major authorities. Site-specific certificate required; SKU-specific documentation preferred for AIFA review.',
      requirements: [
        { label: 'EU-GMP certification',           status: 'met',  detail: 'Mandatory for all imported cannabis products. AIFA accepts EU-GMP certificates from EMA and reciprocal authorities. Site-specific and product-specific certification preferred.' },
        { label: 'AIFA import authorisation',       status: 'met',  detail: 'Per-consignment import authorisation from AIFA. Lead time 3–6 weeks; advance application recommended given AIFA workload. Licensed pharmaceutical importer required.' },
        { label: 'Pharmaceutical importer licence', status: 'met',  detail: 'Licensed pharmaceutical distributor (autorizzazione all\'importazione) required for the importing entity. AIFA licence with narcotic handling authorisation required.' },
        { label: 'Magistral preparation compounding', status: 'met', detail: 'Farmacie galenica (compounding pharmacies) authorised to prepare magistral cannabis preparations from AIFA-authorised bulk product. Standardised magistral preparation protocols published by AIFA.' },
        { label: 'Product labelling (Italian)',      status: 'met',  detail: 'Italian-language labelling required for all product dispensed to Italian patients. AIFA labelling standards for magistral preparations apply.' },
        { label: 'CoA / analytical testing',        status: 'met',  detail: 'Per-batch CoA required. Italian Pharmacopoeia or EU Pharmacopoeia standards apply. Accredited lab required.' },
        { label: 'Regional reimbursement',           status: 'gated', detail: 'National AIFA reimbursement is not available for cannabis medicines. Some regions (Toscana, Veneto, Puglia) have partial regional reimbursement for specific indications. Reimbursement varies significantly by region.' },
        { label: 'Cannabis light market compliance', status: 'gated', detail: '"Cannabis light" (hemp, <0.5% THC) is a separate consumer market governed by L 242/2016; not a medical market pathway. Legal status has been subject to ongoing judicial review.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Market',     headline: 'SCFM production update: Florence facility annual output reaches 350 kg — still 85% below estimated national demand', date: 'Apr 2026', tone: 'amber', category: 'market' },
        { tag: 'Regulatory', headline: 'AIFA issues revised import authorisation guidance — updated CoA requirements and new electronic submission portal', date: 'Mar 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Market',     headline: 'Italian magistral cannabis prescriptions reach estimated 80,000 active patients — 28% annual growth', date: 'Mar 2026', tone: 'green', category: 'market' },
        { tag: 'Policy',     headline: 'Ministero della Salute announces national commission review of SCFM capacity expansion and import policy framework', date: 'Feb 2026', tone: 'gold',  category: 'policy' },
        { tag: 'Trade',      headline: 'Tilray EU supply expansion: Italy named as priority import growth market for 2026 alongside Germany and Poland', date: 'Jan 2026', tone: 'blue',  category: 'trade' },
      ],
      sourceNote: 'Signals sourced from AIFA official publications, Ministero della Salute bulletins, Gazzetta Ufficiale della Repubblica Italiana, and Harbourview distributor network. SCFM production constraints and AIFA import volumes are primary market intelligence monitoring points.',
    },
  },

  // ── POLAND ──────────────────────────────────────────────────────────────────
  {
    slug: 'poland',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Medical access — high-volume import market (GIF)',
      frameworkDetail: 'Poland legalised medical cannabis in 2017 via amendment to the Act on Counteracting Drug Addiction. Any licensed physician can prescribe; dispensing is through licensed pharmacies. Poland has become one of the fastest-growing EU medical cannabis import markets, with estimated 180,000+ active patients as of 2024. GIF (Główny Inspektorat Farmaceutyczny) is the primary regulatory authority.',
      importLabel:     'GIF import permit — per consignment (EU-GMP mandatory)',
      importDetail:    'Import requires a GIF (Chief Pharmaceutical Inspectorate) import permit per consignment. EU-GMP or equivalent certification mandatory. Major import suppliers include Canopy Growth (Spectrum Therapeutics), Tilray, Aurora Cannabis, and others distributing through licensed Polish pharmaceutical wholesalers.',
      operatorLabel:   'Import-dependent market — growing distributor network',
      operatorDetail:  'No significant domestic cultivation; market is almost entirely import-dependent. Multiple licensed pharmaceutical distributors operate as cannabis product importers. Market is characterised by high prescription volume and price sensitivity. Insurance coverage is limited; most patients pay out of pocket.',
      regulatorLabel:  'GIF (Główny Inspektorat Farmaceutyczny)',
      regulatorDetail: 'GIF (Chief Pharmaceutical Inspectorate) governs pharmaceutical import permits, product quality standards, and distribution licensing. GIF operates under the Ministry of Health. Individual physicians are not required to register to prescribe; any licensed MD can initiate prescription.',
    },
    compliance: {
      headline:   'GIF import permit + EU-GMP — high-volume accessible prescribing',
      subline:    'EU-GMP mandatory for all imported product. GIF import permit required per consignment. Any licensed physician can prescribe; any pharmacy with a pharmaceutical licence can dispense. Poland is an accessible, high-volume market with relatively low regulatory complexity for qualified importers.',
      importNote: 'GIF import permit required per consignment. Application requires: EU-GMP certificate, CoA, product description, and licensed importer credentials. GIF processing typically 2–4 weeks. Licensed pharmaceutical wholesale entity (hurtownia farmaceutyczna) required as the importing entity.',
      certNote:   'EU-GMP certificate mandatory for all imported cannabis product. GIF accepts EU-GMP certificates issued by EMA and national competent authorities. Health Canada and TGA GMP certificates accepted under reciprocal recognition. Site-specific certification required.',
      requirements: [
        { label: 'EU-GMP certification',             status: 'met',  detail: 'Mandatory for all imported cannabis medicines. GIF accepts EU-GMP from EMA/national CAs, Health Canada GMP, and TGA GMP.' },
        { label: 'GIF import permit',                status: 'met',  detail: 'Per-consignment import permit from GIF. Required for the licensed wholesale importer. Processing 2–4 weeks.' },
        { label: 'Pharmaceutical wholesale licence', status: 'met',  detail: 'Hurtownia farmaceutyczna licence required for the importing entity. GIF issues pharmaceutical wholesale licences covering narcotic products.' },
        { label: 'Physician prescription',           status: 'met',  detail: 'Any licensed physician (lekarz) can prescribe medical cannabis. No specialist registration or additional prescription authorisation required.' },
        { label: 'Pharmacy dispensing',              status: 'met',  detail: 'Any pharmacy (apteka) with a valid pharmaceutical licence can dispense medical cannabis with a valid physician prescription. No specialist pharmacy requirement.' },
        { label: 'Product labelling (Polish)',        status: 'met',  detail: 'Polish-language labelling or Insert wymagany (required insert) in Polish mandatory for product dispensed to Polish patients. THC/CBD content, batch, expiry, manufacturer required.' },
        { label: 'CoA / analytical testing',         status: 'met',  detail: 'Per-batch CoA required. GIF may request additional testing if CoA from the origin lab is not from a GIF-recognised accredited facility.' },
        { label: 'Insurance (NFZ) reimbursement',    status: 'unavailable', detail: 'NFZ (Narodowy Fundusz Zdrowia) reimbursement for medical cannabis is not available. All costs are out-of-pocket for patients. Price sensitivity is a significant market dynamic.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Market',     headline: 'GIF annual report confirms 1.2 million cannabis prescriptions issued in Poland in 2025 — market doubles in 2 years', date: 'May 2026', tone: 'green', category: 'market' },
        { tag: 'Regulatory', headline: 'GIF issues guidance update on CoA accreditation requirements — foreign lab recognition list expanded', date: 'Apr 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Market',     headline: 'New pharmaceutical wholesale entrant: Bionorica Polska announces cannabis import operations launch', date: 'Mar 2026', tone: 'blue',  category: 'market' },
        { tag: 'Trade',      headline: 'Canopy Growth Spectrum Therapeutics renews Polish supply framework — additional 3-tonne allocation for 2026', date: 'Mar 2026', tone: 'green', category: 'trade' },
        { tag: 'Policy',     headline: 'Polish MoH review of NFZ reimbursement eligibility for paediatric epilepsy indications — decision H2 2026', date: 'Feb 2026', tone: 'gold',  category: 'policy' },
      ],
      sourceNote: 'Signals sourced from GIF official publications, Monitor Polski legislative gazette, and Harbourview distributor and operator network. Poland is a high-velocity market; prescription volume and import permit data are primary monitoring metrics.',
    },
  },

  // ── ISRAEL ──────────────────────────────────────────────────────────────────
  {
    slug: 'israel',
    lastReviewed: '2026-05-28',
    market: {
      frameworkLabel:  'Regulated medical market — IMCA pathway (MOH)',
      frameworkDetail: 'Israel operates one of the most developed medical cannabis markets globally under the Israel Medical Cannabis Agency (IMCA / Yakar). The Ministry of Health (MOH) governs the full supply chain from cultivation licensing to pharmacy dispensing. Israel has approximately 120,000 licensed patients. The country is also a significant cannabis research and export hub, with EU-GMP certified operators exporting to European and other international markets.',
      importLabel:     'MOH/IMCA import permit (limited pathway)',
      importDetail:    'Import into Israel is permitted under MOH narcotics authorisation but is limited in practice; the domestic market is well-supplied by licensed Israeli producers. Import is primarily for research inputs and specific product types not available domestically. Export from Israel requires MOH/IMCA export permit and meets destination-country import requirements.',
      operatorLabel:   'Multi-operator licensed market — major exporters to EU',
      operatorDetail:  'Major licensed operators include Breath of Life (BOL), InterCure (Canndoc), Together Pharma, and others. Several operators hold EU-GMP certification and export to Germany, UK, Czech Republic, and other EU markets via GMP-certified processing facilities. IMCA maintains a licensed operator registry.',
      regulatorLabel:  'IMCA / MOH (Israel Medical Cannabis Agency)',
      regulatorDetail: 'The Israel Medical Cannabis Agency (IMCA) operates within the Ministry of Health and governs all aspects of the medical cannabis supply chain: cultivation licences, manufacture licences, import/export permits, patient registration, and pharmacy dispensing authorisation.',
    },
    compliance: {
      headline:   'IMCA licensing framework — export-capable EU-GMP operators',
      subline:    'Israel\'s IMCA compliance framework aligns with international GMP standards; several licensed operators hold EU-GMP certificates. Export compliance requires meeting destination-country import standards in addition to IMCA requirements.',
      importNote: 'Import authorisation from MOH/IMCA is required for imported cannabis products. In practice, imports are infrequent as domestic supply is generally adequate. Contact Harbourview for routing guidance on import or export operations involving Israel.',
      certNote:   'Several Israeli operators hold EU-GMP certification for export purposes. IMCA conducts regular GMP inspections of licensed facilities. Certificates from IMCA-inspected facilities are recognised by a number of EU competent authorities for import purposes.',
      requirements: [
        { label: 'IMCA cultivation/manufacture licence', status: 'met',   detail: 'All producers and manufacturers require IMCA licensing. Licence categories cover cultivation, extraction, manufacturing, and distribution.' },
        { label: 'EU-GMP certification (for export)',    status: 'met',   detail: 'Multiple Israeli operators hold EU-GMP certificates for export to European markets. IMCA facilitates dual-inspections with EU competent authorities.' },
        { label: 'Patient registration (IMCA portal)',  status: 'met',   detail: 'Patients register via the IMCA online portal with physician confirmation. Approximately 120,000 active registered patients as of 2025.' },
        { label: 'Physician authorisation (IMCA)',      status: 'met',   detail: 'Physicians require specific IMCA authorisation to prescribe. Authorised prescribers are listed in the IMCA registry.' },
        { label: 'Pharmacy dispensing licence (IMCA)',  status: 'met',   detail: 'Pharmacies require specific IMCA dispensing authorisation in addition to standard pharmacy licensing.' },
        { label: 'Export permit (MOH/IMCA)',            status: 'met',   detail: 'Per-consignment export permit from MOH/IMCA required for all cannabis exports. Export certificate confirms GMP status and product specification.' },
        { label: 'MOH import permit (inbound)',         status: 'gated', detail: 'Inbound import is permitted but infrequent. MOH narcotics import authorisation required. Contact Harbourview for routing guidance.' },
        { label: 'Research licensing',                  status: 'met',   detail: 'Israel has a well-developed cannabis research licensing framework; academic and clinical research is actively conducted under IMCA oversight.' },
      ],
    },
    signals: {
      feedSignals: [
        { tag: 'Trade',      headline: 'BOL Pharma (Breath of Life) announces EU-GMP export volumes — 2.8 tonnes shipped to EU in Q1 2026', date: 'May 2026', tone: 'green', category: 'trade' },
        { tag: 'Regulatory', headline: 'IMCA updates export permit guidance — expedited processing pathway for pre-approved EU destinations', date: 'Apr 2026', tone: 'gold',  category: 'regulatory' },
        { tag: 'Market',     headline: 'Israeli medical cannabis patient registry reaches 122,000 — new indication guidelines published for chronic pain', date: 'Apr 2026', tone: 'green', category: 'market' },
        { tag: 'Trade',      headline: 'InterCure (Canndoc) secures German distribution framework agreement — first direct Israel-to-Germany supply channel', date: 'Mar 2026', tone: 'blue',  category: 'trade' },
        { tag: 'Policy',     headline: 'MOH publishes draft revised IMCA operator licensing framework — consultation open until July 2026', date: 'Mar 2026', tone: 'gold',  category: 'policy' },
      ],
      sourceNote: 'Signals sourced from IMCA official publications, MOH circulars, Israel Securities Authority (ISA) operator disclosures, and Harbourview export operator network. Israel export dynamics and IMCA licensing updates are primary monitoring areas.',
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

const registryMap = new Map<string, CountryIntelligenceProfile>(
  registry.map((p) => [p.slug, p])
)

export function getCountryIntelligence(slug: string): CountryIntelligenceProfile | undefined {
  return registryMap.get(slug)
}
