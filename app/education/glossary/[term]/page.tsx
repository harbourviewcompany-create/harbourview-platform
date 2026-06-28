import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// ── Glossary definitions ────────────────────────────────────────────────────
// Orientation-level only. Not legal, regulatory, or QP advice.

const TERMS: Record<string, { title: string; body: string; related?: string[]; category: string }> = {
  // Quality & Manufacturing
  'gmp': {
    title: 'GMP — Good Manufacturing Practice',
    category: 'Quality & Manufacturing',
    body: 'The quality system standard governing pharmaceutical and cannabis manufacturing. GMP covers facility controls, equipment qualification, batch documentation, personnel hygiene, in-process testing, finished product release, and deviation management. EU-GMP is required for cannabis imported into European regulated markets. Health Canada’s Cannabis Regulations incorporate GMP-equivalent requirements for licensed producers.',
    related: ['gacp', 'gdp', 'coa', 'qp', 'capa'],
  },
  'gacp': {
    title: 'GACP — Good Agricultural and Collection Practice',
    category: 'Quality & Manufacturing',
    body: 'The quality standard governing cannabis cultivation, harvesting, drying, and primary processing. GACP documentation establishes the quality baseline for starting material entering a GMP manufacturing process. EU GACP guidelines are published by the European Medicines Agency (EMA). For cannabis intended for export to EU markets, GACP certification at the cultivation site is typically a prerequisite for regulatory acceptance.',
    related: ['gmp', 'gdp', 'coa'],
  },
  'gdp': {
    title: 'GDP — Good Distribution Practice',
    category: 'Quality & Manufacturing',
    body: 'The quality standard governing wholesale storage, transport, chain-of-custody documentation, and controlled-drug distribution. GDP requires qualified personnel, temperature monitoring during transport, validated storage conditions, and audit trail documentation for all product movements. EU GDP Guidelines (2013/C 343/01) apply to medicinal products including authorised cannabis products distributed within the EU.',
    related: ['gmp', 'gacp', 'coa'],
  },
  'coa': {
    title: 'CoA — Certificate of Analysis',
    category: 'Quality & Manufacturing',
    body: 'A batch-specific document from an accredited laboratory confirming product identity, cannabinoid potency, terpene profile, residual solvents, heavy metals, microbiological safety, mycotoxins, and pesticide residues. Most regulated import markets require a CoA from both a source-market accredited lab and a destination-market accredited lab for each batch of imported cannabis.',
    related: ['gmp', 'qp', 'iso-17025'],
  },
  'qp': {
    title: 'QP — Qualified Person',
    category: 'Quality & Manufacturing',
    body: 'The legally designated individual responsible for certifying that a batch was manufactured in accordance with applicable GMP requirements and the terms of the marketing authorisation before it is released for distribution. In EU markets, QP certification is a statutory requirement for all medicinal products. A QP must hold specified academic qualifications and practical experience as defined in Directive 2001/83/EC.',
    related: ['gmp', 'coa', 'market-authorisation'],
  },
  'capa': {
    title: 'CAPA — Corrective and Preventive Action',
    category: 'Quality & Manufacturing',
    body: 'The documented quality management process for investigating a deviation or non-conformance, identifying the root cause, implementing a corrective action to resolve the immediate issue, and implementing a preventive action to stop recurrence. CAPA records are a key inspection focus under GMP audits. Failure to close CAPA investigations within agreed timelines is a common GMP audit finding.',
    related: ['gmp', 'sop'],
  },
  'sop': {
    title: 'SOP — Standard Operating Procedure',
    category: 'Quality & Manufacturing',
    body: 'A written, version-controlled document that describes the steps required to consistently perform a specific manufacturing, quality, or operational activity. SOPs must be approved, controlled under a document management system, accessible to relevant personnel, and reviewed at defined intervals. Absence of SOPs for critical processes is a critical GMP deficiency.',
    related: ['gmp', 'capa'],
  },
  'iso-17025': {
    title: 'ISO 17025 — Laboratory Accreditation Standard',
    category: 'Quality & Manufacturing',
    body: 'The international standard for testing and calibration laboratory competence. ISO 17025 accreditation, issued by a national accreditation body, is required for cannabis analytical laboratories whose CoA results are accepted by competent authorities in most regulated markets. Accreditation scope should cover the specific analytes being tested (cannabinoids, terpenes, contaminants).',
    related: ['coa', 'gmp'],
  },

  // Regulatory & Trade
  'narcotics-export-permit': {
    title: 'Narcotics Export Permit',
    category: 'Regulatory & Trade',
    body: 'The source-country competent authority authorisation required to legally export controlled cannabis products across international borders. Required under Article 31 of the 1961 Single Convention on Narcotic Drugs. The permit specifies the quantity, form, destination country, and authorised importer. It must be matched with a narcotics import authorisation issued by the destination country competent authority before shipment.',
    related: ['narcotics-import-order', 'single-convention-1961', 'phytosanitary-certificate'],
  },
  'narcotics-import-order': {
    title: 'Narcotics Import Order / Import Certificate',
    category: 'Regulatory & Trade',
    body: 'The destination-country competent authority authorisation required to legally import controlled cannabis. Issued by the national narcotics authority (e.g. BfArM in Germany, MHRA in the UK, TGA in Australia). Must specify the substance, quantity, form, source country, and authorised exporter. The import certificate is typically required before the source country will issue the export permit.',
    related: ['narcotics-export-permit', 'single-convention-1961'],
  },
  'single-convention-1961': {
    title: 'Single Convention on Narcotic Drugs 1961',
    category: 'Regulatory & Trade',
    body: 'The foundational international treaty governing the scheduling, production, trade, and use of narcotic substances including cannabis. Parties to the Convention (193 states) must control cannabis cultivation and manufacture through a national agency, issue import/export authorisations for each shipment, and maintain statistical reporting to the INCB (International Narcotics Control Board). The 1971 Convention on Psychotropic Substances and the 1988 Convention against Illicit Traffic complement the 1961 framework.',
    related: ['narcotics-export-permit', 'narcotics-import-order'],
  },
  'market-authorisation': {
    title: 'Market Authorisation (MA)',
    category: 'Regulatory & Trade',
    body: 'The regulatory approval granted by a national medicines authority for a specific pharmaceutical product to be placed on the market. For cannabis-derived medicines, this requires a full dossier including quality, safety, and efficacy data. Only one cannabis-derived medicine (Sativex) holds full EU market authorisation across multiple member states; most cannabis products in European markets operate under special access or national authorisation pathways.',
    related: ['special-access', 'qp'],
  },
  'special-access': {
    title: 'Special Access / Named Patient / Specials',
    category: 'Regulatory & Trade',
    body: 'Regulatory pathways allowing import or use of an unlicensed product outside of formal market authorisation, subject to country-specific conditions. Examples: UK "specials" import authorisation (MHRA Exemption 167), Australian TGA Special Access Scheme (SAS-B), German BfArM individual import permit, Canadian Special Access Program. These pathways allow patient access but impose batch-by-batch import controls.',
    related: ['market-authorisation', 'narcotics-import-order'],
  },
  'phytosanitary-certificate': {
    title: 'Phytosanitary Certificate',
    category: 'Regulatory & Trade',
    body: 'An official document issued by the national plant protection organisation (NPPO) of the exporting country confirming the phytosanitary (plant health) status of plant material. Required for whole plant, dried flower, or plant-origin material. Not typically required for pharmaceutical extracts or finished dosage forms. Issued under the International Plant Protection Convention (IPPC) framework.',
    related: ['narcotics-export-permit'],
  },
  'incoterms': {
    title: 'Incoterms',
    category: 'Regulatory & Trade',
    body: 'International Commercial Terms published by the International Chamber of Commerce (ICC) defining the responsibilities of buyer and seller for delivery, insurance, and customs clearance in international trade. For cannabis shipments, Incoterms affect which party holds GDP responsibility during transit. DDP (Delivered Duty Paid) places import customs and narcotics permit responsibility on the seller; EXW (Ex Works) places it on the buyer.',
    related: ['gdp', 'narcotics-import-order'],
  },
  'eu-gmp-equivalence': {
    title: 'EU-GMP Equivalence / Third-Country GMP Recognition',
    category: 'Regulatory & Trade',
    body: 'The process by which a non-EU country\'s GMP inspection system is recognised as equivalent to EU GMP standards. Bilateral Mutual Recognition Agreements (MRAs) covering GMP exist between the EU and a small number of countries (Australia, Canada, Japan, Switzerland, USA for certain product types). For cannabis products, EU-GMP equivalence is assessed on a site-by-site basis by the EU member state authority responsible for the import authorisation.',
    related: ['gmp', 'market-authorisation'],
  },

  // Clinical & Medical
  'cannabinoids': {
    title: 'Cannabinoids',
    category: 'Clinical & Medical',
    body: 'Chemical compounds that interact with cannabinoid receptors (CB1, CB2) in the human endocannabinoid system. The cannabis plant produces over 100 cannabinoids. The principal regulated cannabinoids are THC (delta-9-tetrahydrocannabinol), the primary psychoactive compound, and CBD (cannabidiol), which is non-psychoactive and is the basis of the first FDA-approved cannabis-derived medicine (Epidiolex). CBG, CBN, THCV, and CBC are emerging minor cannabinoids of commercial and clinical interest.',
    related: ['thc', 'cbd'],
  },
  'thc': {
    title: 'THC — Delta-9-Tetrahydrocannabinol',
    category: 'Clinical & Medical',
    body: 'The primary psychoactive cannabinoid in cannabis. THC content determines the controlled drug scheduling of a cannabis product in most jurisdictions. Products above jurisdiction-specific THC thresholds (typically 0.2–0.3% in the EU, 0.3% in Canada, 1% in the UK for industrial hemp) are classified as controlled cannabis. THC concentration in pharmaceutical cannabis products is expressed as mg/mL or percentage w/w.',
    related: ['cannabinoids', 'cbd'],
  },
  'cbd': {
    title: 'CBD — Cannabidiol',
    category: 'Clinical & Medical',
    body: 'The principal non-psychoactive cannabinoid. CBD does not create intoxication and is not scheduled under the 1961 Convention in its isolated form. CBD isolate and broad-spectrum CBD (THC removed) are subject to varying national regulations — classified as a novel food in the EU, a controlled drug ingredient in some contexts, and an active pharmaceutical ingredient (API) in licensed medicines such as Epidiolex.',
    related: ['cannabinoids', 'thc'],
  },
  'endocannabinoid-system': {
    title: 'Endocannabinoid System (ECS)',
    category: 'Clinical & Medical',
    body: 'A neuromodulatory system comprising endogenous cannabinoid receptors (CB1, predominantly in the CNS; CB2, predominantly in the immune system), endocannabinoids (anandamide, 2-AG), and metabolic enzymes. The ECS regulates mood, pain, appetite, memory, and immune function. Phytocannabinoids (from the cannabis plant) interact with CB1 and CB2 receptors, which is the pharmacological basis for therapeutic cannabis use.',
    related: ['cannabinoids', 'thc', 'cbd'],
  },
  'pharmacovigilance': {
    title: 'Pharmacovigilance',
    category: 'Clinical & Medical',
    body: 'The science and activities relating to the detection, assessment, understanding, and prevention of adverse effects or any other drug-related problems. For licensed cannabis medicines, pharmacovigilance systems must capture adverse event reports, periodic safety update reports (PSURs), and risk management plans as conditions of market authorisation. Post-market safety monitoring is an increasing regulatory requirement for special access cannabis products.',
    related: ['market-authorisation', 'qp'],
  },

  // Market Access
  'licensed-producer': {
    title: 'Licensed Producer (LP)',
    category: 'Market Access',
    body: 'In Canada, a producer licensed by Health Canada under the Cannabis Regulations to cultivate, process, or sell cannabis for medical or adult-use purposes. LP status includes specific authorisation categories: Cultivation, Processing, Sale, Research, and Analytical Testing. Canadian LPs with GMP certification are among the largest export suppliers to regulated international markets.',
    related: ['gacp', 'gmp', 'narcotics-export-permit'],
  },
  'wholesale-distribution-authorisation': {
    title: 'Wholesale Distribution Authorisation (WDA)',
    category: 'Market Access',
    body: 'The licence required under EU Directive 2001/83/EC to wholesale distribute medicinal products, including cannabis-derived medicines. A WDA holder must maintain GDP-compliant facilities, qualified persons for distribution, recall procedures, and quality management systems. Many EU member states require an importer-distributor to hold a WDA in addition to a narcotics wholesale licence before handling imported medicinal cannabis.',
    related: ['gdp', 'market-authorisation'],
  },
  'incb': {
    title: 'INCB — International Narcotics Control Board',
    category: 'Market Access',
    body: 'The independent, quasi-judicial monitoring body for the implementation of UN drug conventions. The INCB monitors global controlled substance supply and demand statistics, assesses compliance with convention obligations, and issues annual reports. All legitimate international cannabis trade (medical cannabis, hemp) must be reported to the INCB. INCB import authorisation codes appear on narcotic drug import certificates in many jurisdictions.',
    related: ['single-convention-1961', 'narcotics-export-permit'],
  },
  'bfarm': {
    title: 'BfArM — Bundesinstitut für Arzneimittel und Medizinprodukte',
    category: 'Market Access',
    body: 'The German Federal Institute for Drugs and Medical Devices. BfArM is the national competent authority for medicinal cannabis in Germany — issuing narcotics import permits, managing the national cannabis agency (for cultivation tenders), maintaining the controlled substances register, and overseeing market authorisation for cannabis-derived pharmaceuticals. Germany is the largest regulated medical cannabis import market in Europe.',
    related: ['narcotics-import-order', 'market-authorisation'],
  },
  'tga': {
    title: 'TGA — Therapeutic Goods Administration',
    category: 'Market Access',
    body: 'Australia\'s national regulator for therapeutic goods, a division of the Department of Health. The TGA\'s Office of Drug Control (ODC) issues import and export licences and permits for medicinal cannabis. Access pathways include: Schedule 8 (Prescription Medicine pathway), Authorised Prescriber, Special Access Scheme B (SAS-B), and Clinical Trial. Australia is a significant regulated cannabis market and a growing export origin for CBD products.',
    related: ['narcotics-import-order', 'special-access'],
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>
}): Promise<Metadata> {
  const { term } = await params
  const def = TERMS[term]
  if (!def) return { title: 'Glossary Term | Harbourview Education' }
  return {
    title: `${def.title} | Harbourview Professional Glossary`,
    description: def.body.slice(0, 155) + '…',
  }
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>
}) {
  const { term } = await params
  const def = TERMS[term]

  if (!def) return notFound()

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="gt-wrap">
        <nav className="gt-nav">
          <Link href="/education" className="gt-nav-link">Education</Link>
          <span className="gt-sep">›</span>
          <Link href="/education/glossary" className="gt-nav-link">Glossary</Link>
          <span className="gt-sep">›</span>
          <span className="gt-cur">{def.title.split(' — ')[0]}</span>
        </nav>

        <div className="gt-card">
          <p className="gt-eyebrow">{def.category}</p>
          <h1 className="gt-title">{def.title}</h1>
          <p className="gt-body">{def.body}</p>

          {def.related && def.related.length > 0 && (
            <div className="gt-related">
              <p className="gt-related-label">Related terms</p>
              <div className="gt-related-links">
                {def.related.map(slug => {
                  const rel = TERMS[slug]
                  return (
                    <Link key={slug} href={`/education/glossary/${slug}`} className="gt-rel-link">
                      {rel ? rel.title.split(' — ')[0] : slug}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="gt-boundary">
          <p className="gt-boundary-label">Education boundary</p>
          <p className="gt-boundary-text">
            Harbourview glossary definitions are orientation-level only. They do not constitute legal
            advice, regulatory guidance, QP opinion, or authoritative interpretation of any
            regulation, standard, or treaty obligation.
          </p>
        </div>

        <div className="gt-actions">
          <Link href="/education/glossary" className="gt-ghost">← Back to Glossary</Link>
          <Link href="/education/request" className="gt-gold">Request Briefing →</Link>
        </div>
      </div>
    </main>
  )
}

// Export the term map so generateStaticParams can use it
export async function generateStaticParams() {
  return Object.keys(TERMS).map(term => ({ term }))
}

const CSS = `
.gt-wrap{max-width:720px;margin:0 auto;padding:48px 24px 80px}
.gt-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px;flex-wrap:wrap}
.gt-nav-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.gt-nav-link:hover{opacity:.7}
.gt-sep{color:rgba(255,255,255,.2);font-size:11px}
.gt-cur{font-size:11px;color:rgba(255,255,255,.4)}
.gt-card{padding:36px 40px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);margin-bottom:20px}
.gt-eyebrow{font-size:10px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:12px}
.gt-title{font-family:Georgia,serif;font-size:clamp(22px,3.5vw,34px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 20px;line-height:1.25}
.gt-body{font-size:15px;line-height:1.8;color:rgba(245,240,232,.7);margin:0}
.gt-related{margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.07)}
.gt-related-label{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:10px}
.gt-related-links{display:flex;flex-wrap:wrap;gap:8px}
.gt-rel-link{padding:4px 12px;border-radius:20px;border:1px solid rgba(212,168,75,.2);background:rgba(212,168,75,.05);font-size:11px;color:#d4a84b;text-decoration:none;transition:background .15s}
.gt-rel-link:hover{background:rgba(212,168,75,.12)}
.gt-boundary{padding:20px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);margin-bottom:24px}
.gt-boundary-label{font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:6px}
.gt-boundary-text{font-size:12px;line-height:1.65;color:rgba(255,255,255,.35);margin:0}
.gt-actions{display:flex;gap:12px;flex-wrap:wrap}
.gt-gold{display:inline-flex;align-items:center;padding:9px 20px;background:#d4a84b;color:#020814;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.gt-gold:hover{opacity:.85}
.gt-ghost{display:inline-flex;align-items:center;padding:9px 20px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:border-color .15s,color .15s}
.gt-ghost:hover{border-color:rgba(255,255,255,.35);color:#fff}
`
