# Consumables Image Generation Prompt Pack v1.1

Purpose: generate or regenerate the 11 representative `.webp` images used by Harbourview Marketplace consumables listings.

Do not generate images from this document unless explicitly instructed. This is the source prompt pack for image production, review and replacement.

## Output Requirements

- Format: `.webp`
- Aspect ratio: 4:3
- Recommended dimensions: 1200 x 900 px
- Minimum dimensions: 800 x 600 px
- Target file size: under 250 KB each
- Hard maximum file size: 400 KB each
- Storage path: `/public/marketplace/consumables/`
- Style target: premium B2B studio product photography
- Image status: representative category image

## Generation Order

Generate in this order:

1. `01-pre-roll-tubes.webp`
2. Review and approve the visual standard.
3. Use the approved first image as the visual anchor for the remaining 10 images.
4. Generate the rest of the set while matching the anchor image's background family, camera distance, shadow softness, realism level and product scale.
5. Reject and regenerate any image that breaks the QA checklist below.

## Universal Prompt Wrapper

Use this wrapper with every category-specific prompt.

```text
Create a premium B2B marketplace category image for Harbourview. This image is representative of the product category only. Do not imply exact unit quantity, exact bundled contents, specific supplier identity or confirmed inventory. Match the same visual language across the full image set: same background family, same camera distance, same lighting softness, same realism level, same shadow intensity and similar product scale. Use a light neutral studio gray or warm off-white background with enough tonal contrast so white or translucent items remain clearly visible. Use soft natural studio lighting from above-front with gentle grounding shadows beneath the products. Use a slightly elevated front-facing product angle. Keep all important product forms fully visible inside the central safe area so the image works well in a marketplace card crop. Show a commercially plausible grouped arrangement, generally 3 to 8 visible product units unless the category naturally requires more. Ensure the materials read accurately and realistically for the category. Do not render any visible text, label copy, product claims, numbers, warning panels or branding. Do not show cannabis flower, concentrate, oil, filled cartridges, filled cones or any product contents. No logos. No people. No hands. No lifestyle setting. No dramatic props. The image should look like a premium B2B category image, not a consumer ad or campaign hero shot. Landscape orientation. 4:3 aspect ratio. Realistic product photography feel.
```

## Universal Negative Prompt

Use this negative prompt with every category-specific prompt when the image tool supports negative prompts.

```text
Avoid distorted products, fake labels, unreadable pseudo-text, brand marks, cannabis leaves, filled products, people, hands, lifestyle scenes, cluttered props, unrealistic packaging shapes, warped duplicated objects, floating objects, harsh dramatic shadows, excessive gloss, over-stylized advertising imagery, pseudo-compliance labels, warning stickers, barcodes, QR codes, product claims, supplier branding and obvious AI artifacts.
```

## Final Category Prompts

### 1. 01-pre-roll-tubes.webp

```text
Create unbranded child-resistant pre-roll tubes in a clean premium B2B studio product-shot style. Include a neat arrangement of plain white, matte black and translucent plastic tubes, with some standing upright and some lying flat so the shape is immediately obvious. Show both standard 98mm and slightly longer tube formats. Ensure the tubes read as realistic plastic packaging, not metal or glass. Do not show cannabis, filled cones, labels, warning text, numbers, logos or brand marks. Keep all tubes fully visible inside the central safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

### 2. 02-mylar-pouches.webp

```text
Create unbranded stand-up mylar pouches in a clean premium B2B studio product-shot style. Include several blank flexible pouches in different sizes suitable for 3.5g to 14g packaging, using a controlled mix of matte black, white and neutral metallic finishes. Make the zipper pouch structure, gusseted base and flexible mylar material visually obvious. Do not show cannabis, label copy, warning panels, nutrition-style boxes, QR codes, numbers, logos or brand marks. Keep the pouches centered, upright and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

### 3. 03-glass-flower-jars.webp

```text
Create unbranded glass flower jars in a clean premium B2B studio product-shot style. Include several small premium empty jars with child-resistant lids, using clear glass, amber glass and black-lid variations. Arrange them neatly so the jar body, lid structure and empty interior are easy to understand at a glance. Ensure the jars read as realistic glass packaging with subtle reflections, not plastic or ceramic. Do not show cannabis flower, contents, labels, warning text, numbers, logos or brand marks. Keep the jars centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

### 4. 04-concentrate-jars.webp

```text
Create unbranded concentrate containers in a clean premium B2B studio product-shot style. Include several small empty concentrate jars suitable for extract, rosin or resin packaging, using clear glass and frosted glass with simple black or white caps. Arrange the jars so the small-format extract container shape is immediately obvious. Ensure the jars read as realistic empty glass or frosted glass packaging. Do not show cannabis concentrate, oil, residue, product contents, labels, warning text, numbers, logos or brand marks. Keep all jars centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

### 5. 05-tincture-bottles.webp

```text
Create unbranded tincture bottles in a clean premium B2B studio product-shot style. Include several empty amber glass dropper bottles in different small retail sizes, each with simple black droppers and clean blank bottle surfaces. Arrange them neatly so the bottle-and-dropper format is obvious. Ensure the bottles read as realistic amber glass with subtle transparency and accurate dropper materials. Do not show liquid contents, cannabis oil, labels, dosage markings, warning text, numbers, logos or brand marks. Keep the bottles centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

### 6. 06-pre-rolled-cones.webp

```text
Create unbranded empty pre-rolled cones in a clean premium B2B studio product-shot style. Include a neat arrangement of empty paper cones with filter tips, shown in grouped bundles and a shallow neutral tray so the bulk supply concept is clear. Show both standard and longer cone formats. Ensure the cones read as realistic paper cones with visible empty openings and natural paper texture. Do not show cannabis flower, filled cones, smoke, labels, packaging text, numbers, logos or brand marks. Keep the cones centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial production supplies.
```

### 7. 07-humidity-packs.webp

```text
Create unbranded humidity control packs in a clean premium B2B studio product-shot style. Include several small sealed packet-style humidity packs arranged in a tidy stack and fan layout so the product format is obvious. Keep the packets plain, sealed and generic, using neutral off-white or light gray materials with realistic soft packet edges. Do not show readable text, percentage numbers, logos, brand marks, cannabis, jars with contents or retail packaging claims. Keep the packets centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial preservation supplies.
```

### 8. 08-labels-and-tamper-seals.webp

```text
Create unbranded packaging labels and tamper-evident sealing supplies in a clean premium B2B studio product-shot style. Include blank label rolls, simple die-cut labels and a small set of clear or neutral shrink bands or tamper seals arranged neatly. The image should communicate packaging compliance supplies without showing any readable text. Ensure the labels read as blank adhesive label stock and the seals read as clear or neutral tamper-evident packaging components. Do not show warning panels, compliance copy, barcodes, QR codes, numbers, logos, brand marks or cannabis imagery. Keep the label rolls and seals centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

### 9. 09-facility-supplies.webp

```text
Create unbranded facility and production consumables in a clean premium B2B studio product-shot style. Include a neat arrangement of blue nitrile gloves, a simple generic wipes canister or pouch and a roll or stack of clean parchment or handling sheets. Keep every item generic, clean and commercially credible. Ensure the nitrile gloves read as gloves, the wipes container reads as sanitation supplies and the parchment sheets read as production handling material. Do not show cannabis product, chemical claims, safety labels, hazard symbols, readable text, logos, brand marks, hands or people. Keep the objects centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial facility supplies.
```

### 10. 10-shipping-cartons-and-bundles.webp

```text
Create unbranded corrugated shipping cartons and bundled packaging supplies in a clean premium B2B studio product-shot style. Include several blank kraft master cases with one open box revealing assorted generic packaging components such as blank tubes, pouches, jars or label rolls inside. The image should communicate bulk procurement and supply readiness without implying exact bundled contents. Ensure the cartons read as realistic corrugated kraft board and the inner supplies remain generic and unbranded. Do not show shipping labels, barcodes, addresses, warning icons, readable text, cannabis imagery, logos or brand marks. Keep the cartons and bundled supplies centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging procurement.
```

### 11. 11-vape-cartridge-packaging.webp

```text
Create unbranded vape cartridge packaging in a clean premium B2B studio product-shot style. Include blank cartridge boxes, neutral blister-style packaging and simple protective inserts arranged neatly. The image should communicate cartridge packaging supplies without showing devices in use. Ensure the boxes read as realistic small retail packaging, the blister material reads as translucent protective packaging and the inserts read as empty protective components. Do not show filled cartridges, vape liquid, oil, devices being used, cannabis imagery, labels, warning text, numbers, logos or brand marks. Keep all packaging centered and fully visible inside the card-safe area. The final image must feel like a neutral representative marketplace category image for commercial packaging supplies.
```

## Batch Generation Instruction

Use this instruction when sending the full batch to an image-generation tool or another assistant.

```text
Generate these 11 images as one coherent Harbourview Marketplace consumables category image set. Use the universal wrapper and negative prompt for every image. Generate `01-pre-roll-tubes.webp` first. Treat the first approved image as the visual anchor for the rest of the set. Match the same background tone, camera angle, scale, softness, shadow style and realism level across all images. Output each image as a 4:3 `.webp` file at 1200 x 900 px. Use the exact filenames provided. Do not add any text, logos, labels, cannabis product, people, hands or supplier branding. These are representative category visuals only, not supplier-provided product photos.
```

## QA Checklist

Reject and regenerate any image that fails one or more of these checks:

- Product category is obvious within 1 second.
- Image works at marketplace card size.
- Important product forms are inside the central crop-safe area.
- Product materials are realistic and category-accurate.
- No visible text, label copy, product claims, numbers, barcodes or QR codes.
- No logos, brand marks or supplier identity.
- No cannabis flower, concentrate, oil, filled cones, filled cartridges or product contents.
- No people, hands or lifestyle setting.
- No distorted packaging, warped duplicates, impossible object shapes or AI artifacts.
- No floating objects or harsh dramatic shadows.
- Background, camera angle, lighting and scale are consistent with the approved visual anchor.
- Image does not imply exact quantity, exact bundle contents or confirmed inventory.
- File is `.webp`, 4:3 and under 400 KB after export.

## Final Filename Map

| Filename | Listing IDs |
|---|---|
| `01-pre-roll-tubes.webp` | cons-001, cons-002 |
| `02-mylar-pouches.webp` | cons-003, cons-004, cons-011 |
| `03-glass-flower-jars.webp` | cons-005 |
| `04-concentrate-jars.webp` | cons-006 |
| `05-tincture-bottles.webp` | cons-007 |
| `06-pre-rolled-cones.webp` | cons-008, cons-009 |
| `07-humidity-packs.webp` | cons-010 |
| `08-labels-and-tamper-seals.webp` | cons-012, cons-017 |
| `09-facility-supplies.webp` | cons-014, cons-015, cons-016 |
| `10-shipping-cartons-and-bundles.webp` | cons-018, cons-019, cons-020 |
| `11-vape-cartridge-packaging.webp` | cons-013 |
