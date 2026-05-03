# Consumables Image Pack v1.0

This is an image-production specification only. Do not generate images unless explicitly instructed.

## Objective

Create a reusable representative image set for Harbourview Marketplace consumables listings. Images must help buyers understand the category without implying verified supplier inventory, exact stock, exact quantities, or supplier-provided proof.

## Asset Goals

- Improve marketplace comprehension at card level.
- Keep visuals consistent, premium, neutral, and B2B credible.
- Avoid supplier-specific claims until supplier imagery is approved.
- Preserve a clean replacement path for supplier-provided or verified imagery later.

## Technical Requirements

- Format: `.webp` only for production assets.
- Recommended dimensions: 1200 x 900 px.
- Aspect ratio: 4:3.
- Minimum acceptable dimensions: 800 x 600 px.
- Target file size: under 250 KB each.
- Hard max file size: 400 KB each.
- Storage path: `/public/marketplace/consumables/`.
- Card rendering: object-cover, 4:3-safe composition.
- Safe zone: keep the primary product group centered within the middle 70% of the image. Avoid placing critical details near the outer 10% edges.

## Visual Style System

Use a premium B2B studio product-photography style. Background must be light neutral studio gray or warm off-white. Avoid pure white if it causes product edges to disappear. Use soft grounding shadows under products. Avoid floating objects or harsh dramatic shadows. Use a slightly elevated front-facing product angle. Avoid extreme top-down views, wide-angle distortion, or macro closeups. Show enough items to communicate commercial bulk supply without clutter. Target 3 to 8 visible product units per image unless the category naturally requires more.

Images must not imply the exact quantity included in the listing. Images are representative only.

## Global Prompt Block

Create a premium B2B marketplace category image for Harbourview. Show the product category clearly in a clean studio product-shot style. Use a neutral light background with soft shadows, restrained premium styling and realistic materials. Keep the image commercially credible, polished and easy to read in a marketplace card. No logos. No brand names. No readable packaging text. No cannabis leaves. No people. No hands. No lifestyle setting. No dramatic props. No glossy ad look. No fake futuristic styling. Keep the composition product-focused, minimal and trustworthy. Use a consistent visual language across the full image set. Landscape orientation. Tight composition. Realistic product photography feel.

## Negative Prompt Block

Avoid distorted products, unreadable pseudo-text, fake labels, brand marks, cannabis leaves, hands, people, lifestyle scenes, dramatic shadows, excessive gloss, cluttered props, unrealistic packaging shapes, misshapen bottles, deformed tubes, duplicated warped objects, AI artifacts and over-stylized advertising imagery.

## Visual Consistency Rule

Generate the first approved image as the visual reference for the remaining set. Match background, lighting, camera angle, shadow softness and product scale across all subsequent images.

## Filename-to-Prompt Table

| Filename | Category | Used by | Prompt |
|---|---|---|---|
| 01-pre-roll-tubes.webp | Pre-roll tubes | cons-001, cons-002 | Create a premium B2B marketplace category image for Harbourview. Show unbranded child-resistant pre-roll tubes in a clean studio product-shot style. Include a neat arrangement of plain white, matte black and translucent tubes, with some standing upright and some lying flat so the form is immediately obvious. Show both standard 98mm and slightly longer tube formats. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 02-mylar-pouches.webp | Mylar pouches and exit bags | cons-003, cons-004, cons-011 | Create a premium B2B marketplace category image for Harbourview. Show unbranded stand-up mylar pouches in a clean studio product-shot style. Include several blank pouches in different sizes suitable for 3.5g to 14g packaging, with a mix of matte black, white and neutral metallic finishes. Make the zipper pouch structure visually obvious. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 03-glass-flower-jars.webp | Glass flower jars | cons-005 | Create a premium B2B marketplace category image for Harbourview. Show unbranded glass flower jars in a clean studio product-shot style. Include several small premium jars with child-resistant lids, using clear glass, amber glass and black-lid variations. Arrange them neatly so the jar body and closure style are easy to understand at a glance. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 04-concentrate-jars.webp | Concentrate jars | cons-006 | Create a premium B2B marketplace category image for Harbourview. Show unbranded concentrate containers in a clean studio product-shot style. Include several small concentrate jars suitable for extracts, rosin and resin packaging, using clear glass and frosted glass with simple black or white caps. Arrange them neatly so the small-format extract container shape is immediately obvious. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 05-tincture-bottles.webp | Tincture bottles | cons-007 | Create a premium B2B marketplace category image for Harbourview. Show unbranded tincture bottles in a clean studio product-shot style. Include several amber glass dropper bottles in different small retail sizes, each with simple black droppers and a clean minimal presentation. Arrange them neatly so the bottle-and-dropper format is obvious. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 06-pre-rolled-cones.webp | Pre-rolled cones | cons-008, cons-009 | Create a premium B2B marketplace category image for Harbourview. Show unbranded pre-rolled cones in a clean studio product-shot style. Include a neat arrangement of empty paper cones with filter tips, shown in grouped bundles and a shallow tray so the bulk supply concept is clear. Show both standard and longer cone formats. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 07-humidity-packs.webp | Humidity packs | cons-010 | Create a premium B2B marketplace category image for Harbourview. Show unbranded humidity control packs in a clean studio product-shot style. Include several small sealed packet-style humidity packs arranged in a tidy stack and fan layout so the product format is obvious. Keep them plain and generic with no visible branding or readable text. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 08-labels-and-tamper-seals.webp | Labels and tamper seals | cons-012, cons-017 | Create a premium B2B marketplace category image for Harbourview. Show unbranded packaging labels and tamper-evident sealing supplies in a clean studio product-shot style. Include blank label rolls, simple die-cut labels and a small set of clear or neutral shrink bands or tamper seals arranged neatly. The image should communicate packaging compliance supplies without showing readable text. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 09-facility-supplies.webp | Facility supplies | cons-014, cons-015, cons-016 | Create a premium B2B marketplace category image for Harbourview. Show unbranded facility and production consumables in a clean studio product-shot style. Include a neat arrangement of blue nitrile gloves, a simple generic wipes canister or pouch and a roll or stack of clean parchment or handling sheets. Keep everything generic, clean and commercially credible. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 10-shipping-cartons-and-bundles.webp | Shipping cartons and bundled supplies | cons-018, cons-019, cons-020 | Create a premium B2B marketplace category image for Harbourview. Show unbranded corrugated shipping cartons and bundled packaging supplies in a clean studio product-shot style. Include several blank kraft master cases with one open box revealing assorted generic packaging components such as tubes, pouches, jars or labels inside. The image should communicate bulk procurement and supply readiness. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |
| 11-vape-cartridge-packaging.webp | Vape cartridge packaging | cons-013 | Create a premium B2B marketplace category image for Harbourview. Show unbranded vape cartridge packaging in a clean studio product-shot style. Include blank cartridge boxes, neutral blister-style packaging and simple protective inserts arranged neatly. The image should communicate cartridge packaging supplies without showing devices in use, branding or readable text. Use a neutral light background with soft shadows and restrained premium styling. No logos, no brand names, no readable text, no cannabis imagery and no people. Keep the composition simple, realistic, polished and product-focused. Landscape orientation with a tight, clean commercial composition. |

## Asset Manifest

| Filename | Category | Used by listing IDs | Alt text | Asset source | Status | Approved for use | Replacement priority |
|---|---|---|---|---|---|---|---|
| 01-pre-roll-tubes.webp | pre_roll_tubes | cons-001, cons-002 | Unbranded child-resistant pre-roll tubes arranged in a studio product shot | generated | representative | pending | medium |
| 02-mylar-pouches.webp | mylar_pouches | cons-003, cons-004, cons-011 | Unbranded stand-up mylar pouches in multiple sizes shown in a studio product shot | generated | representative | pending | medium |
| 03-glass-flower-jars.webp | glass_flower_jars | cons-005 | Unbranded glass flower jars with child-resistant lids shown in a studio product shot | generated | representative | pending | medium |
| 04-concentrate-jars.webp | concentrate_jars | cons-006 | Unbranded concentrate jars for extract packaging shown in a studio product shot | generated | representative | pending | medium |
| 05-tincture-bottles.webp | tincture_bottles | cons-007 | Unbranded amber tincture bottles with droppers shown in a studio product shot | generated | representative | pending | medium |
| 06-pre-rolled-cones.webp | pre_rolled_cones | cons-008, cons-009 | Unbranded pre-rolled cones arranged in bulk supply format in a studio product shot | generated | representative | pending | medium |
| 07-humidity-packs.webp | humidity_packs | cons-010 | Unbranded humidity control packs arranged in a studio product shot | generated | representative | pending | medium |
| 08-labels-and-tamper-seals.webp | labels_tamper_seals | cons-012, cons-017 | Unbranded labels and tamper-evident sealing supplies shown in a studio product shot | generated | representative | pending | medium |
| 09-facility-supplies.webp | facility_supplies | cons-014, cons-015, cons-016 | Unbranded facility consumables including nitrile gloves, wipes and parchment shown in a studio product shot | generated | representative | pending | medium |
| 10-shipping-cartons-and-bundles.webp | shipping_cartons_bundles | cons-018, cons-019, cons-020 | Unbranded corrugated cartons and bundled packaging supplies shown in a studio product shot | generated | representative | pending | medium |
| 11-vape-cartridge-packaging.webp | vape_cartridge_packaging | cons-013 | Unbranded vape cartridge packaging supplies shown in a studio product shot | generated | representative | pending | medium |

## Supplier Image Replacement Rule

Supplier images may replace representative category images only after:

1. Permission to use is confirmed.
2. Product identity matches the listing.
3. Image does not contain misleading labels, claims, or restricted branding.
4. Harbourview approves public use.

## Generated Image Audit Note

Generated category images are representative category artwork, not supplier-provided proof of product availability.

## QA Checklist

- [ ] All images use 1200 x 900 px or minimum 800 x 600 px.
- [ ] All images are `.webp`.
- [ ] All files are under 400 KB, target under 250 KB.
- [ ] Product category is obvious within 1 second.
- [ ] No readable or fake text appears.
- [ ] No brand or logo appears.
- [ ] No cannabis leaf or cannabis product appears.
- [ ] No people or hands appear.
- [ ] Product shapes are realistic.
- [ ] Image looks credible at card size.
- [ ] Image crops cleanly in 4:3.
- [ ] Background and lighting match the set.
- [ ] Image does not imply verified stock, exact quantity, or specific supplier identity.
- [ ] Image badge remains readable over both light and mid-tone image areas.

## Implementation Acceptance Criteria

The image system is accepted when:

- Every consumables listing shows an image area.
- Every consumables listing has alt text.
- Every consumables listing displays `Representative image` unless upgraded to supplier-provided or verified.
- Broken image paths fall back gracefully to the built-in representative visual.
- Mobile card view remains clean at 320px width.
- Quote CTA remains visible without excessive scrolling.
- If an image is missing, the listing remains publishable using the built-in representative fallback visual.

## Versioning

- v1.0: Representative generated category image system.
- v1.1: Supplier images added after permission and review.
- v1.2: New categories added.
- v2.0: Real inventory imagery system with source-level verification.
