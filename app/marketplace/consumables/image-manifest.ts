export type ConsumablesImageStatus = 'ready' | 'needed'

export type ConsumablesImageManifestItem = {
  key: string
  path: string
  alt: string
  status: ConsumablesImageStatus
  generationPrompt: string
}

export const CONSUMABLES_IMAGE_MANIFEST = {
  packagingPouches: {
    key: 'packagingPouches',
    path: '/marketplace/images/packaging-pouches.webp',
    alt: 'Unbranded packaging pouches shown as representative consumables category imagery',
    status: 'ready',
    generationPrompt:
      'Photorealistic premium stand-up pouches on a dark navy studio surface, unbranded, clean controlled lighting, no cannabis flower, no logos, no certificates.',
  },
  labQaConsumables: {
    key: 'labQaConsumables',
    path: '/marketplace/images/lab-qa-consumables.webp',
    alt: 'Unbranded lab and quality assurance supplies shown as representative consumables category imagery',
    status: 'ready',
    generationPrompt:
      'Photorealistic unbranded lab consumables, clean sample containers and QA supplies on a dark navy surface, controlled lighting, no regulated claims.',
  },
  cultivationInputs: {
    key: 'cultivationInputs',
    path: '/marketplace/images/cultivation-inputs.webp',
    alt: 'Unbranded cultivation inputs shown as representative consumables category imagery',
    status: 'ready',
    generationPrompt:
      'Photorealistic unbranded cultivation input packaging and facility consumables, premium dark navy composition, no plant material, no supplier branding.',
  },
  facilitySupplies: {
    key: 'facilitySupplies',
    path: '/marketplace/images/facility-supplies.webp',
    alt: 'Unbranded facility supplies shown as representative consumables category imagery',
    status: 'ready',
    generationPrompt:
      'Photorealistic sanitation, processing and maintenance consumables on a controlled studio background, unbranded, no compliance certificates.',
  },
  warehouseLogistics: {
    key: 'warehouseLogistics',
    path: '/marketplace/images/warehouse-logistics.webp',
    alt: 'Unbranded warehouse and logistics supplies shown as representative consumables marketplace imagery',
    status: 'ready',
    generationPrompt:
      'Photorealistic unbranded warehouse, cartons and logistics consumables arranged on a dark navy studio surface, premium controlled lighting.',
  },
  preRollConesKingSize: {
    key: 'preRollConesKingSize',
    path: '/images/consumables/pre-roll-cones-king-size.webp',
    alt: 'Unbranded king-size pre-roll cones shown as a representative consumables product slot',
    status: 'needed',
    generationPrompt:
      'Photorealistic premium pre-roll cones on dark navy studio surface, no branding, no cannabis flower, clean controlled lighting, realistic paper texture.',
  },
  matteChildResistantPouches: {
    key: 'matteChildResistantPouches',
    path: '/images/consumables/matte-child-resistant-pouches.webp',
    alt: 'Unbranded matte child-resistant stand-up pouches shown as a representative consumables product slot',
    status: 'needed',
    generationPrompt:
      'Three matte stand-up pouches, neutral colors, child-resistant zipper detail, white or navy background, no brand marks, no regulated claims.',
  },
  premiumGlassJars: {
    key: 'premiumGlassJars',
    path: '/images/consumables/premium-glass-jars.webp',
    alt: 'Unbranded premium glass jars shown as a representative consumables product slot',
    status: 'needed',
    generationPrompt:
      'Clear and amber glass jars with premium lids, empty, clean reflections, dark navy studio setting, no logo, no cannabis imagery.',
  },
  rollLabelsTamperSeals: {
    key: 'rollLabelsTamperSeals',
    path: '/images/consumables/roll-labels-tamper-seals.webp',
    alt: 'Unbranded roll labels and tamper seals shown as a representative consumables product slot',
    status: 'needed',
    generationPrompt:
      'Roll labels and tamper seals, premium close-up, blank label surfaces, subtle gold and navy palette, no supplier logo, no certificate imagery.',
  },
  customRetailCartons: {
    key: 'customRetailCartons',
    path: '/images/consumables/custom-retail-cartons.webp',
    alt: 'Unbranded custom retail cartons shown as a representative consumables product slot',
    status: 'needed',
    generationPrompt:
      'Blank retail cartons and sleeves with premium packaging composition, dark navy studio background, no regulated claims, no logos.',
  },
  opaqueFlowerJars: {
    key: 'opaqueFlowerJars',
    path: '/images/consumables/opaque-flower-jars.webp',
    alt: 'Unbranded opaque jars shown as a representative consumables product slot',
    status: 'needed',
    generationPrompt:
      'Opaque black, white and amber jars with matched lids, premium dark navy surface, empty containers, no logo, no cannabis imagery.',
  },
} as const satisfies Record<string, ConsumablesImageManifestItem>

export type ConsumablesImageKey = keyof typeof CONSUMABLES_IMAGE_MANIFEST
