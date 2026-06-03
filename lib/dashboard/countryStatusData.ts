/**
 * lib/dashboard/countryStatusData.ts
 *
 * Cannabis regulatory intelligence for all ~195 countries in the Harbourview registry.
 * Covers: market status, commercial opportunity, regulatory environment, market activity,
 * composite opportunity score (0–100), adult use status, and medical use status.
 *
 * Score methodology
 * ─────────────────
 * 85–100  Established legal commercial market, clear import/export pathways
 * 70–84   Active medical or developing adult-use framework, real deal flow
 * 50–69   Partial access, clinical or restricted commercial activity
 * 30–49   Limited/review-gated, reform active, CBD/hemp present
 * 10–29   Prohibition with narrow exceptions or traditional tolerance
 * 0–9     Total prohibition, high enforcement risk
 *
 * Last reviewed: June 2026
 * Maintain: update score + status when a country passes a new law or regulation.
 */

// ── Color palette ─────────────────────────────────────────────────────────────
const G  = '#6FCF7D'  // green  — open / legal / favorable
const D  = '#D9A441'  // gold   — developing / partial / moderate
const B  = '#5DAFC8'  // blue   — under review / uncertain
const O  = '#D49560'  // orange — complex / evolving
const X  = '#6F7A86'  // gray   — prohibited / no activity / minimal
const R  = '#D65C4A'  // red    — restricted / illegal

export type CountryStatusBar = {
  status: string;       statusColor: string
  opportunity: string;  opportunityColor: string
  regulatory: string;   regulatoryColor: string
  activity: string;     activityColor: string
  score: number
  adultUse: string
  medicalUse: string
}

// ── Status data ────────────────────────────────────────────────────────────────
// Keys are ISO 3166-1 alpha-2 codes, uppercase.
// All 191 natural-earth countries + HK, MO, TW, XK supplementals.

export const COUNTRY_STATUS_DATA: Record<string, CountryStatusBar> = {

  // ── A ──────────────────────────────────────────────────────────────────────

  AE: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  AF: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  AL: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  AM: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:18, adultUse:'Illegal',       medicalUse:'CBD Only'    },
  AO: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  AR: { status:'Developing',     statusColor:D, opportunity:'High',      opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:65, adultUse:'Decriminalized',medicalUse:'Legal'       },
  AT: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Moderate',    regulatoryColor:D, activity:'Moderate',    activityColor:D, score:55, adultUse:'None',          medicalUse:'Legal'       },
  AU: { status:'Market Open',    statusColor:G, opportunity:'High',      opportunityColor:D, regulatory:'Established', regulatoryColor:G, activity:'Strong',      activityColor:D, score:84, adultUse:'Limited',       medicalUse:'Legal'       },
  AX: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:18, adultUse:'None',          medicalUse:'Limited'     },
  AZ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:4,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── B ──────────────────────────────────────────────────────────────────────

  BA: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:12, adultUse:'Illegal',       medicalUse:'CBD Only'    },
  BD: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  BE: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:30, adultUse:'None',          medicalUse:'CBD Only'    },
  BF: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  BG: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:25, adultUse:'None',          medicalUse:'CBD Only'    },
  BI: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  BJ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  BN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:1,  adultUse:'Illegal',       medicalUse:'None'        },
  BO: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  BR: { status:'Developing',     statusColor:D, opportunity:'High',      opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:68, adultUse:'Decriminalized',medicalUse:'Legal'       },
  BS: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:22, adultUse:'Decriminalized',medicalUse:'None'        },
  BT: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  BW: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  BY: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  BZ: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:18, adultUse:'Decriminalized',medicalUse:'None'        },

  // ── C ──────────────────────────────────────────────────────────────────────

  CA: { status:'Market Open',    statusColor:G, opportunity:'Very High',  opportunityColor:G, regulatory:'Mature',      regulatoryColor:G, activity:'Very Strong', activityColor:G, score:95, adultUse:'Legal',         medicalUse:'Legal'       },
  CD: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  CF: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  CG: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  CH: { status:'Under Review',   statusColor:B, opportunity:'Medium',    opportunityColor:D, regulatory:'Progressive', regulatoryColor:G, activity:'Moderate',    activityColor:D, score:55, adultUse:'Pilot',         medicalUse:'Legal'       },
  CI: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  CL: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Moderate',    activityColor:D, score:60, adultUse:'Decriminalized',medicalUse:'Legal'       },
  CM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  CN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  CO: { status:'Developing',     statusColor:D, opportunity:'High',      opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:65, adultUse:'Decriminalized',medicalUse:'Legal'       },
  CR: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:32, adultUse:'None',          medicalUse:'CBD Only'    },
  CU: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  CV: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  CY: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:44, adultUse:'None',          medicalUse:'Legal'       },
  CZ: { status:'Under Review',   statusColor:B, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:52, adultUse:'Decriminalized',medicalUse:'Legal'       },

  // ── D ──────────────────────────────────────────────────────────────────────

  DE: { status:'Market Open',    statusColor:G, opportunity:'Very High',  opportunityColor:G, regulatory:'Progressive', regulatoryColor:G, activity:'Very Strong', activityColor:G, score:91, adultUse:'Legal',         medicalUse:'Legal'       },
  DJ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  DK: { status:'Under Review',   statusColor:B, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:49, adultUse:'None',          medicalUse:'Legal'       },
  DM: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:12, adultUse:'Traditional',   medicalUse:'None'        },
  DO: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  DZ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── E ──────────────────────────────────────────────────────────────────────

  EC: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:35, adultUse:'Decriminalized',medicalUse:'None'        },
  EE: { status:'Under Review',   statusColor:B, opportunity:'Low',       opportunityColor:X, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:35, adultUse:'None',          medicalUse:'Legal'       },
  EG: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  EH: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  ER: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  ES: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Evolving',    regulatoryColor:O, activity:'Moderate',    activityColor:D, score:48, adultUse:'Tolerated',     medicalUse:'Limited'     },
  ET: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── F ──────────────────────────────────────────────────────────────────────

  FI: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Limited',     activityColor:X, score:35, adultUse:'None',          medicalUse:'Legal'       },
  FJ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  FK: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:18, adultUse:'None',          medicalUse:'Limited'     },
  FO: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:22, adultUse:'None',          medicalUse:'Limited'     },
  FR: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Moderate',    activityColor:D, score:54, adultUse:'None',          medicalUse:'Limited'     },

  // ── G ──────────────────────────────────────────────────────────────────────

  GA: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  GB: { status:'Under Review',   statusColor:B, opportunity:'Medium',    opportunityColor:D, regulatory:'Under Review', regulatoryColor:B, activity:'Developing', activityColor:D, score:47, adultUse:'None',          medicalUse:'Limited'     },
  GE: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:38, adultUse:'Decriminalized',medicalUse:'None'        },
  GH: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  GL: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:22, adultUse:'None',          medicalUse:'Limited'     },
  GM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  GN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  GQ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  GR: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:55, adultUse:'None',          medicalUse:'Legal'       },
  GS: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:0,  adultUse:'N/A',           medicalUse:'N/A'         },
  GT: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  GU: { status:'Partial Access', statusColor:D, opportunity:'Low',       opportunityColor:X, regulatory:'Complex',     regulatoryColor:O, activity:'Limited',     activityColor:X, score:40, adultUse:'Legal',         medicalUse:'Legal'       },
  GW: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  GY: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:20, adultUse:'Decriminalized',medicalUse:'None'        },

  // ── H ──────────────────────────────────────────────────────────────────────

  HK: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  HM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:0,  adultUse:'N/A',           medicalUse:'N/A'         },
  HN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  HR: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:44, adultUse:'Decriminalized',medicalUse:'Legal'       },
  HT: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  HU: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:10, adultUse:'Illegal',       medicalUse:'None'        },

  // ── I ──────────────────────────────────────────────────────────────────────

  ID: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  IE: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:45, adultUse:'None',          medicalUse:'Legal'       },
  IL: { status:'Market Open',    statusColor:G, opportunity:'High',      opportunityColor:D, regulatory:'Favorable',   regulatoryColor:G, activity:'Strong',      activityColor:D, score:79, adultUse:'Limited',       medicalUse:'Legal'       },
  IM: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:25, adultUse:'None',          medicalUse:'Limited'     },
  IN: { status:'Restricted',     statusColor:R, opportunity:'Medium',    opportunityColor:D, regulatory:'Complex',     regulatoryColor:O, activity:'Limited',     activityColor:X, score:28, adultUse:'Traditional',   medicalUse:'Research Only'},
  IQ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  IR: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  IS: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:30, adultUse:'None',          medicalUse:'Legal'       },
  IT: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:51, adultUse:'None',          medicalUse:'Limited'     },

  // ── J ──────────────────────────────────────────────────────────────────────

  JM: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Moderate',    activityColor:D, score:52, adultUse:'Decriminalized',medicalUse:'Legal'       },
  JO: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  JP: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'Research Only'},

  // ── K ──────────────────────────────────────────────────────────────────────

  KE: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  KG: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  KH: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  KI: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  KM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  KP: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:1,  adultUse:'Illegal',       medicalUse:'None'        },
  KR: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:22, adultUse:'Illegal',       medicalUse:'Limited'     },
  KW: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  KZ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── L ──────────────────────────────────────────────────────────────────────

  LA: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  LB: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:48, adultUse:'None',          medicalUse:'Legal'       },
  LC: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:22, adultUse:'Decriminalized',medicalUse:'None'        },
  LK: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'Research Only'},
  LR: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  LS: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:42, adultUse:'None',          medicalUse:'Legal'       },
  LT: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:30, adultUse:'None',          medicalUse:'CBD Only'    },
  LU: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Progressive', regulatoryColor:G, activity:'Limited',     activityColor:X, score:40, adultUse:'Legal',         medicalUse:'Legal'       },
  LV: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:22, adultUse:'None',          medicalUse:'CBD Only'    },
  LY: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── M ──────────────────────────────────────────────────────────────────────

  MA: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:48, adultUse:'None',          medicalUse:'Legal'       },
  MD: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  ME: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:15, adultUse:'None',          medicalUse:'CBD Only'    },
  MG: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  MK: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:48, adultUse:'None',          medicalUse:'Legal'       },
  ML: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  MM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  MN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  MO: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  MR: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  MU: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  MW: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:38, adultUse:'None',          medicalUse:'Legal'       },
  MX: { status:'Developing',     statusColor:D, opportunity:'High',      opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:62, adultUse:'Decriminalized',medicalUse:'Legal'       },
  MY: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:1,  adultUse:'Illegal',       medicalUse:'None'        },
  MZ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── N ──────────────────────────────────────────────────────────────────────

  NA: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  NC: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:18, adultUse:'None',          medicalUse:'Limited'     },
  NE: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  NG: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  NI: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  NL: { status:'Partial Access', statusColor:D, opportunity:'High',      opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Active',      activityColor:D, score:62, adultUse:'Tolerated',     medicalUse:'Legal'       },
  NO: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Limited',     activityColor:X, score:42, adultUse:'None',          medicalUse:'Legal'       },
  NP: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Traditional',   medicalUse:'None'        },
  NZ: { status:'Market Open',    statusColor:G, opportunity:'High',      opportunityColor:D, regulatory:'Favorable',   regulatoryColor:G, activity:'Strong',      activityColor:D, score:78, adultUse:'Limited',       medicalUse:'Legal'       },

  // ── O ──────────────────────────────────────────────────────────────────────

  OM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── P ──────────────────────────────────────────────────────────────────────

  PA: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:10, adultUse:'Illegal',       medicalUse:'None'        },
  PE: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:48, adultUse:'Decriminalized',medicalUse:'Legal'       },
  PF: { status:'Restricted',     statusColor:R, opportunity:'Minimal',   opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:18, adultUse:'None',          medicalUse:'Limited'     },
  PG: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  PH: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'CBD Only'    },
  PK: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  PL: { status:'Market Open',    statusColor:G, opportunity:'High',      opportunityColor:D, regulatory:'Favorable',   regulatoryColor:G, activity:'Strong',      activityColor:D, score:68, adultUse:'None',          medicalUse:'Legal'       },
  PR: { status:'Partial Access', statusColor:D, opportunity:'Low',       opportunityColor:X, regulatory:'Complex',     regulatoryColor:O, activity:'Moderate',    activityColor:D, score:42, adultUse:'Medical Only',  medicalUse:'Legal'       },
  PS: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  PT: { status:'Partial Access', statusColor:D, opportunity:'High',      opportunityColor:D, regulatory:'Progressive', regulatoryColor:G, activity:'Growing',     activityColor:D, score:67, adultUse:'Tolerated',     medicalUse:'Legal'       },
  PY: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:22, adultUse:'Illegal',       medicalUse:'None'        },

  // ── Q ──────────────────────────────────────────────────────────────────────

  QA: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── R ──────────────────────────────────────────────────────────────────────

  RO: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:38, adultUse:'None',          medicalUse:'Legal'       },
  RS: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:28, adultUse:'None',          medicalUse:'CBD Only'    },
  RU: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  RW: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── S ──────────────────────────────────────────────────────────────────────

  SA: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:1,  adultUse:'Illegal',       medicalUse:'None'        },
  SB: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  SD: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  SE: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:28, adultUse:'None',          medicalUse:'Limited'     },
  SI: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Developing',  activityColor:D, score:40, adultUse:'Decriminalized',medicalUse:'Legal'       },
  SK: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:22, adultUse:'None',          medicalUse:'CBD Only'    },
  SL: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  SN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  SO: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  SR: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:20, adultUse:'Decriminalized',medicalUse:'None'        },
  SS: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  ST: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  SV: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  SY: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  SZ: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Minimal',     activityColor:X, score:22, adultUse:'Traditional',   medicalUse:'None'        },

  // ── T ──────────────────────────────────────────────────────────────────────

  TD: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  TF: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:0,  adultUse:'N/A',           medicalUse:'N/A'         },
  TG: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  TH: { status:'Partial Access', statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Evolving',    regulatoryColor:O, activity:'Growing',     activityColor:D, score:55, adultUse:'None',          medicalUse:'Legal'       },
  TJ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  TL: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  TM: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },
  TN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  TR: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:15, adultUse:'Illegal',       medicalUse:'None'        },
  TT: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Evolving',    regulatoryColor:O, activity:'Limited',     activityColor:X, score:28, adultUse:'Decriminalized',medicalUse:'None'        },
  TW: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  TZ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── U ──────────────────────────────────────────────────────────────────────

  UA: { status:'Under Review',   statusColor:B, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Limited',     activityColor:X, score:35, adultUse:'None',          medicalUse:'Legal'       },
  UG: { status:'Prohibited',     statusColor:X, opportunity:'Low',       opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'Minimal',     activityColor:X, score:8,  adultUse:'Illegal',       medicalUse:'None'        },
  US: { status:'Complex',        statusColor:O, opportunity:'Very High',  opportunityColor:G, regulatory:'Complex',     regulatoryColor:O, activity:'Very Strong', activityColor:G, score:71, adultUse:'State Only',    medicalUse:'State Only'  },
  UY: { status:'Market Open',    statusColor:G, opportunity:'Medium',    opportunityColor:D, regulatory:'Established', regulatoryColor:G, activity:'Moderate',    activityColor:D, score:60, adultUse:'Legal',         medicalUse:'Legal'       },
  UZ: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── V ──────────────────────────────────────────────────────────────────────

  VE: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },
  VI: { status:'Partial Access', statusColor:D, opportunity:'Low',       opportunityColor:X, regulatory:'Complex',     regulatoryColor:O, activity:'Limited',     activityColor:X, score:42, adultUse:'Medical Only',  medicalUse:'Legal'       },
  VN: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },
  VU: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:5,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── W ──────────────────────────────────────────────────────────────────────

  WS: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:3,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── X (supplemental) ──────────────────────────────────────────────────────

  XK: { status:'Restricted',     statusColor:R, opportunity:'Low',       opportunityColor:X, regulatory:'Strict',      regulatoryColor:R, activity:'Minimal',     activityColor:X, score:15, adultUse:'Illegal',       medicalUse:'CBD Only'    },

  // ── Y ──────────────────────────────────────────────────────────────────────

  YE: { status:'Prohibited',     statusColor:X, opportunity:'Minimal',   opportunityColor:X, regulatory:'Prohibitive', regulatoryColor:R, activity:'No Activity', activityColor:X, score:2,  adultUse:'Illegal',       medicalUse:'None'        },

  // ── Z ──────────────────────────────────────────────────────────────────────

  ZA: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:45, adultUse:'Decriminalized',medicalUse:'Legal'       },
  ZM: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:35, adultUse:'None',          medicalUse:'Legal'       },
  ZW: { status:'Developing',     statusColor:D, opportunity:'Medium',    opportunityColor:D, regulatory:'Developing',  regulatoryColor:D, activity:'Growing',     activityColor:D, score:38, adultUse:'None',          medicalUse:'Legal'       },
}

// ── Fallback for any country not yet catalogued ────────────────────────────────
export const STATUS_FALLBACK: CountryStatusBar = {
  status: 'Under Assessment', statusColor: B,
  opportunity: 'Unknown',     opportunityColor: X,
  regulatory: 'Unknown',      regulatoryColor: X,
  activity: 'No Data',        activityColor: X,
  score: 0,
  adultUse: '—',
  medicalUse: '—',
}

export function getCountryStatusBar(iso2: string | null | undefined): CountryStatusBar {
  if (!iso2) return STATUS_FALLBACK
  return COUNTRY_STATUS_DATA[iso2.toUpperCase()] ?? STATUS_FALLBACK
}
