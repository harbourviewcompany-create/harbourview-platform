# Harbourview Intelligence + Access Layer Build Task

## Mission
Build the Intelligence + Access layer around the Harbourview marketplace so Harbourview feels like a dominant cannabis commercial intelligence and market-access network, not only a listing marketplace.

This is build-first execution. Implement visible product modules first, then run verification and report repair items.

## Strategic Outcome
Harbourview should connect marketplace supply, buyer demand, documents, counterparties, routes, introductions, and commercial intelligence into one serious market-access operating system.

Visitors should see:
- active demand intelligence
- market access pathways
- document readiness signals
- counterparty intelligence profiles
- route-to-market guidance
- commercial intelligence briefs
- relationship/network activity
- qualified access and introduction flows

## Inspect First
Inspect and reuse existing repo patterns:

- app/marketplace/**
- app/intelligence/**
- app/signals/**
- app/intake/**
- app/admin/**
- components/**
- components/marketplace/**
- components/intelligence/**
- lib/marketplace/**
- lib/intelligence/**
- lib/data/**
- lib/platform/**
- tests/**
- scripts/**
- docs/control/**
- package.json

## Phase 1 — Intelligence + Access Hub
Create or update a public-facing Intelligence + Access entry point using existing routes if available.

Preferred route options:
- /intelligence
- /market-access
- /signals
- /marketplace/intelligence

Use the route that best fits the current app structure.

Hub sections:
- Hero
- Demand Intelligence
- Document Readiness
- Market Access Pathways
- Counterparty Profiles
- Route-to-Market Match Engine V0
- Commercial Intelligence Briefs
- Relationship Graph Preview
- Request Access / Submit Opportunity CTA

Hero headline:
Commercial intelligence and market access for regulated cannabis counterparties.

Hero subcopy:
Track demand signals, documentation readiness, market pathways, counterparties, and qualified introductions across cannabis supply, services, equipment, packaging, and regulated-market channels.

Primary CTA:
Request Market Access Review

Secondary CTA:
Submit Opportunity

Tertiary CTA:
Explore Demand Signals

## Phase 2 — Demand Intelligence
Build visible demand-intelligence modules that show what buyers and operators are looking for.

Demand sections:
- Active Buyer Demand
- Product Demand by Format
- Regional Demand
- Documentation-Driven Demand
- Service / Equipment / Packaging Demand
- Market Access Demand

Initial demand signals:
1. EU buyer reviewing GMP-oriented Canadian flower
2. Canadian buyer seeking premium craft flower
3. Processor seeking extraction biomass
4. Distributor seeking white-label SKUs
5. Operator seeking compliant packaging
6. Facility seeking surplus equipment
7. Buyer seeking vape/distillate inputs
8. Supplier needed for cultivation consumables
9. Operator seeking QA/GMP support
10. Importer reviewing GACP documentation pathways

Each signal should show:
- demand type
- region
- format/category
- documentation need
- urgency label
- match CTA
- public summary

CTA examples:
- Submit Matching Supply
- Request Buyer Match
- Review Demand Fit

## Phase 3 — Document Readiness
Build document-readiness tiles and opportunity-level readiness fields.

Readiness categories:
- COA
- Licence documentation
- GACP
- EU-GMP
- Export package
- Import review
- QA package
- Stability / specification package
- Product photos
- Packaging details
- Facility / process documentation

Readiness labels:
- Available after qualification
- Review-ready
- Requested
- Pathway dependent
- Buyer-market dependent
- Not applicable

Add a Document Readiness module to the hub and to relevant cards where useful.

## Phase 4 — Market Access Pathway Pages
Create or improve market access pathway pages/cards for:

- Germany import pathway
- UK specials pathway
- Portugal export pathway
- Canada domestic wholesale
- EU-GMP route support
- LATAM market entry
- Australia pathway
- Israel pathway
- Poland pathway
- Czechia pathway
- Distributor / importer introductions

Each pathway card/page should show:
- route summary
- buyer/importer type
- documentation requirements
- product fit
- commercial blockers
- Harbourview action
- CTA

CTA examples:
- Request Route Review
- Submit Product for Pathway Review
- Request Importer Introduction

## Phase 5 — Access Request Workflow
Create a clean access/introduction request workflow using existing intake routes and APIs where possible.

Access request intents:
- buyer-access
- seller-introduction
- document-review
- route-review
- counterparty-review
- demand-match
- market-access-review

Public CTAs should route into existing intake flows with useful query params or preselected intent values.

If there is already an intake form, extend the visible options and routing. If not, create a polished front-end request flow that captures user intent and routes to the safest existing submission path.

## Phase 6 — Counterparty Profiles
Build public-safe counterparty profile cards and private-ready data shape.

Public profile types:
- Licensed Producer
- Processor
- Extractor
- Packager
- Packaging Supplier
- Equipment Supplier
- QA / Compliance Firm
- GMP Consultant
- Logistics Provider
- Distributor
- Importer
- Market Access Partner

Public fields:
- profile type
- region
- category coverage
- pathway relevance
- documentation readiness label
- introduction status
- summary
- CTA

Private-ready fields can be modeled in data shape/comments for later admin use:
- relationship strength
- last touch
- fit score
- intro readiness
- document gaps
- risk notes
- next action

Visible module:
- Featured Counterparty Network
- Supplier / Partner Verticals
- Request Introduction

## Phase 7 — Matching Engine V0
Build a simple deterministic matching layer.

Inputs:
- product/category
- region
- documentation status
- pathway
- buyer need
- supplier type
- urgency

Outputs:
- route fit label
- demand fit label
- documentation fit label
- introduction readiness label
- recommended CTA

Example match labels:
- Strong route fit
- Documentation review needed
- Buyer demand match
- Supplier match available
- Pathway dependent
- Ready for access review

Use static/deterministic logic first. No complex AI requirement.

## Phase 8 — Relationship Graph Preview
Build a visual relationship/network module.

Public preview should show Harbourview as a connector between:
- supply
- buyer demand
- documents
- routes
- counterparties
- services
- equipment
- packaging
- market access

Use a polished visual module, graph-style layout, radial network, node grid, or relationship map based on existing UI capabilities.

Admin/private operational graph can remain future-ready as data shape and comments.

## Phase 9 — Commercial Intelligence Briefs
Add short commercial intelligence brief cards.

Initial briefs:
1. Germany import route watch
2. Canadian craft flower demand
3. EU-GMP supply gaps
4. Packaging procurement signals
5. Biomass and extraction input demand
6. Used/surplus equipment movement
7. Portugal export pathway watch
8. UK specials pathway signal

Each brief should show:
- title
- region
- category
- signal type
- public summary
- related CTA

CTA examples:
- Request Briefing
- Submit Matching Opportunity
- Review Pathway

## Public / Private Data Model
Create clean public DTOs for visible cards/modules.

Recommended types:

```ts
export type PublicDemandSignal = {
  id: string;
  title: string;
  region: string;
  category: string;
  format?: string;
  documentationNeed?: string;
  urgency: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  publicBadges: string[];
};

export type PublicDocumentReadiness = {
  id: string;
  label: string;
  status: string;
  summary: string;
  appliesTo: string[];
};

export type PublicMarketAccessPathway = {
  id: string;
  title: string;
  region: string;
  pathwayType: string;
  productFit: string[];
  documentationRequirements: string[];
  commercialBlockers: string[];
  harbourviewAction: string;
  ctaLabel: string;
  ctaHref: string;
  publicBadges: string[];
};

export type PublicCounterpartyProfile = {
  id: string;
  profileType: string;
  region: string;
  categoryCoverage: string[];
  pathwayRelevance: string[];
  documentationReadiness: string;
  introductionStatus: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  publicBadges: string[];
};

export type PublicIntelligenceBrief = {
  id: string;
  title: string;
  region: string;
  category: string;
  signalType: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  publicBadges: string[];
};
```

Use existing repo style and type placement where possible.

## UI Modules
Build reusable modules where practical:

- IntelligenceAccessHero
- DemandSignalCard
- DemandSignalGrid
- DocumentReadinessTiles
- MarketAccessPathwayCard
- MarketAccessPathwayGrid
- CounterpartyProfileCard
- CounterpartyProfileGrid
- MatchEnginePreview
- RelationshipGraphPreview
- CommercialBriefCard
- CommercialBriefGrid
- AccessRequestCtaPanel

Use existing components if they already cover these patterns.

## Routes
Use existing routes first. Add route pages only where they fit the current app structure.

Preferred route coverage:
- /intelligence
- /signals
- /marketplace
- /marketplace/wanted
- /marketplace/services
- /marketplace/used-surplus
- /marketplace/consumables
- /marketplace/new-products
- /marketplace/cannabis-inventory
- /intake

Add links between marketplace and intelligence/access modules.

## Visual Direction
Premium institutional intelligence network:
- deep navy
- charcoal
- restrained gold
- glass panels
- signal cards
- map/pathway modules
- network graph feel
- serious B2B commercial tone
- strong desktop density
- clean mobile stack

## Verification
After implementation, run:
- npm run typecheck
- npm run build

Also run if available:
- npm run lint
- npm test
- npm run test:visibility
- npm run verify:leakage
- npm run probe:production-visibility

Use verification to identify repair items after build.

## Visual QA
Report:
- Intelligence + Access hub desktop
- Intelligence + Access hub mobile
- Demand Intelligence section
- Document Readiness section
- Market Access Pathways
- Counterparty Profiles
- Match Engine V0
- Relationship Graph Preview
- Commercial Intelligence Briefs
- CTA visibility above fold

## Final Output
Return:

# INTELLIGENCE + ACCESS BUILD RESULT

## Inspected
- Routes
- Components
- Data/DTO
- Existing intelligence/signals/marketplace patterns

## Built
- Intelligence + Access hub
- Demand Intelligence
- Document Readiness
- Market Access Pathways
- Access Request workflow
- Counterparty Profiles
- Matching Engine V0
- Relationship Graph Preview
- Commercial Intelligence Briefs

## Changed Files

## Routes Updated

## Public DTO / Data Model
- Demand signals
- Document readiness
- Market access pathways
- Counterparty profiles
- Matching engine
- Commercial briefs

## UI Modules

## CTA Map

## Visual QA
- Desktop
- Mobile
- Modules
- CTA above fold

## Verification
- command
- result
- relevant output

## Repair Items
- post-build issues to fix next

## Rollback
- revert instructions

## GO
- intelligence + access layer ready for review: yes/no
- next repair/build step
