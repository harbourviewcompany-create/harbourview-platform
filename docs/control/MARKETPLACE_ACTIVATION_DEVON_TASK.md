# Harbourview Marketplace + Market Access Build-First Codex Task

## Mission
Build Harbourview into a live-feeling, premium B2B commercial network now. Start with the marketplace, then expand into consumables, services, wanted requests, cannabis inventory, packaging, equipment, supplier categories, market access pathways, and intelligence-backed route-to-market pages.

## Build Mode
This is a full build-mode task for Codex. Prioritize visible product implementation, commercial usability, polished buyer/seller experience, mobile polish, and desktop polish. Verification and repair come after the build is in place.

Build the product experience first:
- active cards
- premium visual panels
- filters
- category pages
- buyer and seller CTAs
- public listing DTOs
- market access pages
- pathway cards
- mobile polish
- desktop polish
- post-build verification report

## Outcome
The marketplace should feel active, credible, and commercially useful. A visitor should immediately understand that Harbourview can route qualified buyers and sellers across cannabis inventory, consumables, equipment, packaging, services, wanted requests, supplier opportunities, market access pathways, and regulated-market intelligence.

## Inspect First
Inspect and reuse the existing repo structure:

- app/marketplace/**
- app/marketplace/page.tsx
- app/marketplace/sell/**
- app/marketplace/wanted/**
- app/intake/**
- app/intelligence/**
- app/signals/**
- app/page.tsx
- components/marketplace/**
- components/**
- lib/marketplace/**
- lib/data/**
- lib/**
- public/**
- tests/**
- scripts/**
- package.json

## Phase 1 — Marketplace Hub Activation
Update `/marketplace` into a premium active marketplace hub.

Sections:
- Hero
- Featured Active Opportunities
- Browse by Category
- Browse by Format
- Confidential Marketplace Workflow
- Submit Supply
- Buyer Wanted
- Supplier / Service Categories

Hero headline:
Confidential cannabis market access for qualified buyers and sellers.

Hero subcopy:
Explore active supply opportunities, buyer demand signals, supplier categories, consumables, equipment, services, and regulated-market pathways across Canadian and international cannabis markets.

Primary CTA:
Request Qualified Access

Secondary CTA:
Submit Supply Opportunity

Tertiary CTA:
Post Buyer Requirement

## Phase 2 — Active Confidential Inventory Cards
Implement 12 initial active confidential marketplace cards:

1. Alberta Licensed Craft Flower
2. British Columbia Licensed Indoor Flower
3. Quebec Licensed Indoor Flower
4. Canadian Bulk Flower
5. Canadian Extraction Biomass
6. Alberta Pre-Roll Program
7. BC Solventless Extract Opportunity
8. Canadian Vape / Distillate Inputs
9. EU-GMP Medical Flower Pathway
10. Canadian Private Label Program
11. Licensed Packaging / Ancillary Partner
12. Buyer Wanted: Premium Canadian Craft Flower

Each card should show:
- Opportunity Status
- Seller Type or Buyer Type
- Counterparty Visibility
- COA Status
- Documentation Package
- EU-GMP Status
- GACP Status where relevant
- Export Readiness
- Import Readiness
- Access
- Region
- Format
- CTA

Use active commercial language such as:
- Licensed Alberta craft flower opportunity available through confidential buyer review.
- COA and seller documentation are available to qualified counterparties after access approval.
- Seller introduction and commercial terms are handled through Harbourview's private review process.

## Phase 3 — Expand Category Coverage
Build the same active-card/category-page pattern across these marketplace drivers:

### Cannabis Inventory
Focus: flower, bulk flower, biomass, pre-rolls, extracts, solventless, vape/distillate inputs, EU-GMP medical pathway, private label.

### Consumables
Focus: cultivation consumables, facility inputs, sanitation supplies, lab consumables, packaging consumables, operating supplies, compliance supplies.

### Packaging
Focus: jars, bags, tubes, cartons, labels, child-resistant packaging, medical packaging, white-label packaging programs.

### Equipment
Focus: used/surplus equipment, extraction equipment, packaging equipment, cultivation equipment, lab/testing equipment, processing equipment.

### Services
Focus: GMP support, QA/compliance, extraction services, packaging services, distribution support, market access support, logistics support.

### Wanted Requests
Focus: buyer demand signals, supplier requests, route-to-market requests, EU-facing supply needs, packaging/equipment procurement needs.

### Supplier Categories
Focus: licensed sellers, commercial suppliers, service providers, packaging suppliers, equipment suppliers, logistics providers, market-access partners.

For each category page touched, create a premium category header, useful card grid, CTA panel, and mobile-friendly browsing experience.

## Phase 4 — Major-Network Expansion Modules
Add high-visibility modules so Harbourview feels like a broad active commercial network rather than a small early marketplace.

### Market Access Pathways
Create visible pathway modules/cards for:
- Germany import pathway
- UK specials pathway
- Portugal export pathway
- Canada domestic wholesale
- EU-GMP route support
- LATAM market entry
- Distributor / importer introductions

### Live Demand Signals
Create a buyer-demand section that makes active demand visible:
- Buyer seeking Canadian craft flower
- EU buyer reviewing GMP-oriented flower
- Processor seeking biomass
- Distributor seeking white-label SKUs
- Operator seeking compliant packaging
- Facility seeking surplus equipment
- Supplier wanted for consumables
- Service provider wanted for QA/GMP support

### Supplier Network Verticals
Create supplier-network tiles/cards for:
- Licensed producers
- Processors
- Extractors
- Packagers
- GMP consultants
- QA/compliance firms
- Packaging suppliers
- Equipment suppliers
- Logistics providers
- Import/export advisors
- Distribution partners
- Market-access partners

### Documentation & Readiness Tiles
Add readiness tiles that show what buyers care about:
- COA available
- Licence documentation
- GACP documentation
- EU-GMP pathway
- Export package
- Import review
- QA package
- Stability / spec package
- Documentation available after qualification

### Featured Commercial Modules
Add large marketplace modules for:
- Active Supply
- Buyer Demand
- Consumables
- Packaging
- Equipment
- Services
- Market Access
- Supplier Network

### Newest Opportunities
Add a section for recently added marketplace items, using active card styling and timestamp-style labels such as Recently Added, New Intake, or New Buyer Demand.

### Recently Updated
Add a section that creates activity density with labels such as:
- Documentation updated
- Buyer demand active
- Supplier intake open
- Category expanded
- New pathway added

### Submit to Network by User Type
Add a user-type CTA section with clear paths:
- I have supply
- I am looking to buy
- I offer services
- I sell equipment
- I sell packaging
- I supply consumables
- I need market access
- I want a confidential introduction

### Region / Pathway Browse
Add a region/pathway browsing module for:
- Canada
- Alberta
- British Columbia
- Quebec
- Ontario
- Europe
- Germany
- United Kingdom
- Portugal
- LATAM
- International

### Mobile Sticky CTA
Add a mobile-friendly sticky CTA or compact bottom action bar where it fits existing UI patterns:
- Request Access
- Submit Supply
- Buyer Wanted

## Phase 5 — Market Access Intelligence Layer
After the marketplace activation is built, add the Market Access Intelligence Layer so Harbourview feels like a true intelligence + market-access network, not only a marketplace.

Preferred route:
- /market-access

### Market Access Landing Page
Build sections:
- Hero
- Featured Market Pathways
- Global Pathway Grid
- Country Pathway Cards
- Regulated-Market Readiness
- Buyer/Seller Pathway Split
- Importer / Distributor Introductions
- Documentation & Compliance Readiness
- Featured Market Access Opportunities
- Signals / Intelligence Cross-Links
- Request Market Access Review CTA

Hero headline:
Market access intelligence for regulated cannabis channels.

Hero subcopy:
Explore country pathways, importer/distributor routes, documentation readiness, EU-GMP support, buyer/seller fit, and confidential commercial introductions across regulated cannabis markets.

Primary CTA:
Request Market Access Review

Secondary CTA:
Explore Pathways

### Route Integration
Add clear links into `/market-access` from:
- homepage
- `/marketplace`
- marketplace category pages
- marketplace inventory cards where relevant
- `/signals`
- `/intelligence`

Use labels such as:
- Market Access
- Review Route to Market
- Explore Market Pathway
- Request Pathway Review
- Connect Inventory to Market Access

### Expanded Pathway Coverage
Create public pathway cards/pages for:
- Germany Medical Cannabis Import Pathway
- United Kingdom Specials / Medical Pathway
- Portugal Export / EU Supply Pathway
- Canada Domestic Wholesale Pathway
- Australia Medical Cannabis Pathway
- Poland Medical Cannabis Pathway
- Czech Republic Medical Cannabis Pathway
- LATAM Market Entry Review
- EU-GMP Route Support
- Importer / Distributor Introductions
- International Route-to-Market Review

### Country / Pathway Page Depth
Each country/pathway page or detail section should include:
- Market overview
- Commercial entry routes
- Product formats
- Required documents
- Buyer/seller fit
- Import/export relevance
- Readiness badges
- Related marketplace cards
- Signals/intelligence links
- CTA panel

### Buyer-Side and Seller-Side Pathway Split
Add sections for:
- I have supply for this market
- I need access to this market
- I need an importer/distributor
- I need documentation review
- I need buyer demand visibility
- I need route-to-market support

### Commercial-Readiness Scoring
Add visible badges/readiness labels:
- Documentation Ready
- Importer Review Needed
- EU-GMP Pathway
- EU-GMP Certified
- GACP Documentation
- COA Package Available
- Export Package Available
- Buyer Match Potential
- Route Review Required
- Distributor Fit Review
- Market Access Review

### Intelligence Layer Connection
Cross-link the market access layer with:
- `/signals`
- `/intelligence`
- marketplace cards
- country/pathway pages
- buyer demand cards

Add copy:
Market pathways are supported by Harbourview intelligence, route review, buyer/seller matching, and confidential counterparty access.

### Marketplace-to-Market-Access Connection
Connect relevant marketplace inventory cards to pathway pages.

Examples:
- EU-GMP Medical Flower Pathway -> `/market-access/eu-gmp-route-support`
- Germany-facing flower opportunity -> `/market-access/germany-medical-cannabis-import`
- Portugal export pathway -> `/market-access/portugal-export-eu-supply`
- Canada domestic wholesale cards -> `/market-access/canada-domestic-wholesale`
- Buyer Wanted: Premium Canadian Craft Flower -> `/market-access/international-route-to-market`

Each relevant marketplace card should be able to show:
- Related pathway
- Route review available
- Documentation review available
- Market access CTA

### Market Access CTA Matrix
Use these CTA routes where possible:
- Request Pathway Review -> `/intake?intent=pathway-review`
- Submit Supply for Market Review -> `/marketplace/sell?intent=market-review`
- Request Importer Introduction -> `/intake?intent=importer-introduction`
- Request Distributor Review -> `/intake?intent=distributor-review`
- Post Buyer Requirement -> `/marketplace/wanted`
- Request Documentation Review -> `/intake?intent=documentation-review`
- Request Market Access Review -> `/intake?intent=market-access-review`

### Market Access Visual Modules
Build premium modules:
- global pathway grid
- country cards
- readiness badge strip
- importer/distributor introduction module
- documentation packet module
- featured market access opportunities
- related marketplace inventory strip
- signals/intelligence cross-link panel
- mobile sticky CTA

Visual style:
- deep navy
- charcoal
- restrained gold
- map/pathway lines
- document badges
- institutional intelligence aesthetic
- mobile-first CTA access

### Public Pathway DTO
Create or reuse a public pathway DTO:

```ts
export type PublicMarketAccessPathway = {
  id: string;
  slug: string;
  title: string;
  market: string;
  region: string;
  pathwayType: string;
  commercialStage: string;
  documentationReadiness: string;
  importExportRelevance: string;
  partnerType: string;
  accessLevel: string;
  buyerSellerFit: string[];
  productFormats: string[];
  requiredDocuments: string[];
  readinessBadges: string[];
  relatedMarketplaceSlugs: string[];
  relatedSignalRoutes: string[];
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  imageKey: string;
  publicBadges: string[];
};
```

## Minimum Category Card Counts
Build enough visible depth that the network feels major and active.

Minimum public card targets:
- Cannabis Inventory: 12 cards
- Consumables: 8 cards
- Packaging: 8 cards
- Equipment: 8 cards
- Services: 8 cards
- Wanted Requests: 8 cards
- Supplier Network: 8 cards
- Market Access: 6 cards

If implementation time requires sequencing, complete the marketplace hub and first 12 active cards first, then add the category depth and market access layer in the same pattern and report what was completed.

## Public Marketplace DTO
Use or create a clean public marketplace DTO for public card rendering.

Recommended shape:

```ts
export type PublicMarketplaceCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  region: string;
  format: string;
  opportunityStatus: string;
  counterpartyType?: string;
  counterpartyVisibility: string;
  coaStatus?: string;
  documentationPackage: string;
  euGmpStatus?: string;
  gacpStatus?: string;
  exportReadiness?: string;
  importReadiness?: string;
  access: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  imageKey: string;
  publicBadges: string[];
};
```

Public marketplace components should consume the public DTO. Use existing data/component patterns where possible.

## Filters
Implement or improve filters for:

Format:
Flower, Bulk Flower, Biomass, Pre-Roll, Extract, Solventless, Vape, White Label, Packaging, Equipment, Consumables, Services, Buyer Demand

Region:
Alberta, British Columbia, Quebec, Ontario, Canada, Europe, International

Documentation:
COA Available, Licensed Seller, Export Documentation, EU-GMP Certified, EU-GMP Pathway, GACP Available, Documentation Available

Access:
Qualified Buyers Only, Qualified Sellers Only, Seller Introduction Available, Documentation Review, Confidential Opportunity

Commercial Stage:
Active Opportunity, Intake Open, Buyer Matching, Seller Review, Documentation Review, Supplier Review

Empty state:
No public results match this filter. Request private marketplace access for confidential opportunities.

## CTA Routing
Use existing routes where possible:

- Request Qualified Access -> /intake?intent=buyer-access
- Submit Supply Opportunity -> /marketplace/sell or /submit-listing
- Post Buyer Requirement -> /marketplace/wanted
- Request Seller Introduction -> /intake?intent=seller-introduction
- Request Documentation Review -> /intake?intent=documentation-review
- Submit Supply for Review -> /marketplace/sell or /submit-listing

## Visual Direction
Build a premium institutional marketplace aesthetic:

- deep navy
- charcoal
- restrained gold
- glass and stone materiality
- active B2B marketplace feel
- polished product/category visual panels
- strong desktop grid
- strong mobile stack
- buyer/seller CTAs visible without hunting

Use existing assets, safe generated-style placeholders, or styled visual panels.

Suggested image keys:
- alberta-craft-flower
- bc-indoor-flower
- quebec-indoor-flower
- canadian-bulk-flower
- extraction-biomass
- alberta-preroll-program
- bc-solventless-extract
- canadian-vape-distillate
- eu-gmp-medical-flower
- canadian-private-label
- packaging-ancillary
- buyer-wanted-craft-flower
- consumables-operating-supplies
- packaging-programs
- used-surplus-equipment
- commercial-services
- supplier-network
- market-access-pathways
- live-demand-signals
- documentation-readiness
- newest-opportunities
- recently-updated
- country-pathway-grid
- importer-distributor-introductions

## Post-Build Verification and Repair
After implementation, run verification and report anything that needs a follow-up repair patch.

Run:
- npm run typecheck
- npm run build

Also run if available:
- npm run lint
- npm test
- npm run test:visibility
- npm run verify:leakage
- npm run probe:production-visibility

Use verification to identify repair items after the marketplace and market access build exists.

## Visual QA
Report:
- Desktop marketplace hub
- Mobile marketplace hub
- Category pages touched
- Filters desktop/mobile
- Featured opportunity cards
- CTA visibility above fold
- Empty filter state
- Market access pathways
- Live demand signals
- Supplier network verticals
- Market access landing page
- Country/pathway pages
- Readiness modules
- Mobile sticky CTA

## Final Output
Return:

# HARBOURVIEW MARKETPLACE + MARKET ACCESS BUILD RESULT

## Inspected
- Routes
- Components
- Data/DTO
- Tests/probes

## Built
- Marketplace hub
- Cannabis inventory cards
- Consumables
- Packaging
- Equipment
- Services
- Wanted requests
- Supplier categories
- Market access pathways
- Live demand signals
- Documentation/readiness tiles
- Region/pathway browse
- Market access landing page
- Country/pathway pages
- Marketplace-to-market-access connections
- Signals/intelligence cross-links
- Mobile sticky CTA

## Changed Files

## Routes Updated

## Listings / Cards
slug | title | category | CTA route

## Market Access Pathways
slug | title | CTA route | related marketplace cards

## Category Depth
- Cannabis Inventory
- Consumables
- Packaging
- Equipment
- Services
- Wanted Requests
- Supplier Network
- Market Access

## DTO / Data Model
- Marketplace DTO
- Pathway DTO
- Data source
- Public components consuming DTOs

## Filters

## CTA Map

## Image / Visual Handling

## Visual QA
- Desktop
- Mobile
- Filters
- CTA above fold
- Category pages
- Market access pages
- Mobile sticky CTA

## Verification
- command
- result
- relevant output

## Repair Items
- post-build issues to fix next

## Rollback
- revert instructions

## GO
- build ready for review: yes/no
- next repair/build step
