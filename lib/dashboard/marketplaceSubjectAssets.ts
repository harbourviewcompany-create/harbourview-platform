import { LISTING_SUBJECT_ASSETS as GENERATED_ASSETS } from './listingSubjectAssets.generated'

export const LISTING_SUBJECT_ASSETS = GENERATED_ASSETS

export type SubjectMediaRule = { terms: string[]; asset: string }

/** Ordered most-specific first. Matched against title + category. */
export const SUBJECT_MEDIA_RULES: SubjectMediaRule[] = [
  { terms: ["vape cartridge", "510", "ceramic 510", "thread battery", "vape hardware"], asset: "representative/v3/vape-hardware.png" },
  { terms: ["pre-roll multi-pack", "pre-roll box", "cr slider", "pre-roll tube"], asset: "representative/v4/pre-roll-packaging.png" },
  { terms: ["pre-roll cone", "rolling paper", "filter tip"], asset: "representative/v3/pre-roll-consumables.png" },
  { terms: ["pre-roll machine"], asset: "representative/v4/pre-roll-machine.png" },
  { terms: ["mylar", "smell-proof", "exit bag", "stand-up pouch", "foil-lined", "pouch"], asset: "representative/v2/packaging-pouches.png" },
  { terms: ["glass jar", "concentrate jar", "dispensary jar", "borosilicate"], asset: "representative/v3/glass-jars.png" },
  { terms: ["plastic jar", "pop-top"], asset: "representative/v4/plastic-jars.png" },
  { terms: ["dried flower", "eu-gmp certified dried", "eu-gmp certified flower", "flower lot"], asset: "representative/v6/dried-flower.png" },
  { terms: ["biomass", "trim lot"], asset: "representative/v6/biomass.png" },
  { terms: ["co2 extraction", "co₂ extraction", "supercritical"], asset: "representative/v5/co2-extraction-system.png" },
  { terms: ["ethanol extraction"], asset: "representative/v6/ethanol-extraction-system.png" },
  { terms: ["short-path", "distillation"], asset: "representative/v6/short-path-distillation.png" },
  { terms: ["extract", "isolate", "distillate", "full-spectrum"], asset: "representative/v3/extract-isolate.png" },
  { terms: ["capsule"], asset: "representative/v3/capsules.png" },
  { terms: ["tincture"], asset: "representative/v3/tincture-packaging.png" },
  { terms: ["topical"], asset: "representative/v3/topical-packaging.png" },
  { terms: ["seed", "feminised", "feminized"], asset: "representative/v3/seeds.png" },
  { terms: ["cutting", "tissue-cultured", "rooted"], asset: "representative/v3/rooted-cuttings.png" },
  { terms: ["grow light", "led grow"], asset: "representative/v2/grow-lighting.png" },
  { terms: ["nutrient", "cultivation input"], asset: "representative/v2/cultivation-inputs.png" },
  { terms: ["lab", "hplc", "testing", "coa", "instrumentation"], asset: "representative/v6/lab-testing-instrumentation.png" },
  { terms: ["advisory", "due diligence", "regulatory counsel", "m&a"], asset: "representative/v2/advisory-services.png" },
  { terms: ["warehouse", "logistics", "gdp", "cold-chain"], asset: "representative/v2/warehouse-logistics.png" },
  { terms: ["retail", "dispensary licence", "pharmacy"], asset: "representative/v5/retail-facility.png" },
  { terms: ["cultivation facility", "grow room", "indoor grow"], asset: "representative/v4/cultivation-facility.png" },
  { terms: ["processing facility"], asset: "representative/v3/processing-facility.png" },
  { terms: ["packaging suite", "child-resistant packaging", "custom print"], asset: "representative/v4/mixed-packaging-suite.png" },
  { terms: ["label"], asset: "representative/v3/labels-signage.png" },
  { terms: ["humidity", "curing"], asset: "representative/v3/humidity-curing.png" },
  { terms: ["shipping", "corrugated", "void fill", "stretch wrap"], asset: "representative/v3/shipping-supplies.png" },
]
