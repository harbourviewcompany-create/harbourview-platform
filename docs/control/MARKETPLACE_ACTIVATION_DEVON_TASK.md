# Harbourview Marketplace Activation

## Mission
Activate the Harbourview marketplace as a polished, live-feeling confidential B2B cannabis marketplace with active inventory, premium visuals, buyer-critical fields, filters, and qualified-access CTAs.

## Core Outcome
The public marketplace should feel commercially active and operational.

Public listings should render active confidential inventory while confidential seller identity, licence details, pricing, quantities, COAs, and transaction terms remain inside private/admin flows.

## Inspect First
- app/marketplace/**
- app/marketplace/page.tsx
- app/marketplace/sell/**
- app/marketplace/wanted/**
- app/intake/**
- components/marketplace/**
- components/**
- lib/marketplace/**
- lib/data/**
- public/**
- tests/**
- scripts/**
- package.json

## Build

### Marketplace Structure
Implement or update:
- Hero
- Featured Active Opportunities
- Browse by Format
- Confidential Marketplace Workflow
- Submit Supply
- Buyer Wanted

Hero headline:
Confidential cannabis market access for qualified buyers and sellers.

Hero subcopy:
Explore active supply opportunities, buyer demand signals, and regulated-market pathways across Canadian and international cannabis markets.

Primary CTA:
Request Qualified Access

Secondary CTA:
Submit Supply Opportunity

## Public DTO
Use an allowlisted public marketplace DTO.

Public marketplace components should consume only the public DTO.

Recommended DTO:

```ts
export type PublicMarketplaceCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  region: string;
  format: string;
  opportunityStatus: string;
  sellerType?: string;
  buyerType?: string;
  sellerIdentity?: string;
  buyerIdentity?: string;
  coaStatus: string;
  euGmpStatus: string;
  gacpStatus?: string;
  exportReadiness: string;
  importReadiness: string;
  documentationPackage: string;
  access: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  imageKey: string;
  publicBadges: string[];
};
```

## Listings
Implement these 12 listings:

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

Each card should visibly render:
- Opportunity Status
- Seller Type or Buyer Type
- Seller Identity or Buyer Identity: Confidential
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

## Filters
Implement filters for:

Format:
Flower, Bulk Flower, Biomass, Pre-Roll, Extract, Solventless, Vape, White Label, Packaging, Buyer Demand

Region:
Alberta, British Columbia, Quebec, Canada, Europe, International

Documentation:
COA Available, Licensed Seller, Export Documentation, EU-GMP Certified, EU-GMP Pathway, GACP Available

Access:
Qualified Buyers Only, Qualified Sellers Only, Seller Introduction Available, Documentation Review, Confidential Opportunity

Commercial Stage:
Active Opportunity, Intake Open, Buyer Matching, Seller Review, Documentation Review

Empty state:
No public results match this filter. Request private marketplace access for confidential opportunities.

## CTA Routing
Use existing routes where possible.

Preferred:
- /intake?intent=buyer-access
- /marketplace/sell
- /submit-listing
- /marketplace/wanted
- /intake?intent=seller-introduction
- /intake?intent=documentation-review

## Visual Direction
Premium institutional marketplace.

Use:
- deep navy
- charcoal
- restrained gold
- glass and stone materiality
- confidential B2B intelligence aesthetic

Use existing assets, generated-style placeholders, or styled visual panels.

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

## Public/Private Proof
Add or extend a marketplace visibility proof.

Check:
- /marketplace
- /marketplace/sell if public
- /marketplace/wanted if public
- listing detail routes if present

Confirm public output excludes confidential/admin field names and values.

## Verify
Run:
- npm run typecheck
- npm run build

Also run if available:
- npm run lint
- npm test
- npm run probe:production-visibility

## Visual QA
Report:
- Desktop marketplace grid
- Mobile marketplace grid
- Filters
- Featured opportunities
- CTA visibility above fold
- Listing detail page if present

## Final Output
Return:

# MARKETPLACE ACTIVATION RESULT

## Inspected
- Routes
- Components
- Data/DTO
- Tests/probes

## Changed Files

## Routes Updated

## Listings
slug | title | CTA route

## DTO Proof
- DTO
- Mapper if used
- Public components consuming DTO

## Filters

## CTA Map

## Image Handling

## Public/Private Proof
- Routes checked
- Method
- Result

## Visual QA
- Desktop
- Mobile
- Filters
- CTA above fold
- Detail page

## Commands
- command
- result
- relevant output

## Rollback
- revert instructions

## GO
- marketplace activation ready: yes/no
- remaining implementation notes
