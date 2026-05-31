# Harbourview Dashboard Design Handoff

## Purpose

This document defines the approved layout, component hierarchy, and responsive design direction for the Harbourview platform dashboard. It is a design/specification handoff only: it does not expand product scope, add implementation requirements, or introduce new platform claims.

The dashboard must present Harbourview as a premium commercial intelligence and marketplace platform, not a generic SaaS analytics dashboard or pharma market-access workflow.

## Design Principles

- Use a premium dark navy / near-black interface with restrained gold Harbourview accents.
- Use the Harbourview gold wordmark only. Do not place a compass logo, icon mark, or other symbol beside the wordmark.
- Organize the experience around three dashboard pillars: Marketplace, Intel Signals, and Education.
- Prioritize Marketplace as the main commercial browsing surface.
- Present Intel Signals as a differentiated and memorable module, without allowing the heatmap globe to become a full-page hero.
- Treat Education as a credible third pillar, not a lightweight blog sidebar.
- Keep information dense but readable through compact cards, thin borders, and disciplined spacing.
- Avoid decorative analytics, unnecessary graphs, fake metrics, or unverified operational claims.

## Product Structure

The dashboard has exactly three main sections:

1. **Marketplace** — primary commercial section for listing-led browsing and purchasing intent.
2. **Intel Signals** — differentiated intelligence section centered on a compact heatmap globe and reviewed signal feed.
3. **Education** — supporting knowledge section with professional resources, courses, guides, articles, and webinars.

Do not add additional dashboard pillars or convert the dashboard into a generic reporting cockpit.

## Desktop Layout Specification

### Frame

- Use a desktop shell with a compact left rail and a three-column content grid.
- Outer page padding: `24px`.
- Main card gap: `12px` to `16px`.
- Desktop panels should use `14px` to `18px` corner radii.
- Listing rows should be approximately `92px` to `120px` tall.
- Use thin rounded borders and minimal shadows.

### Left Rail

The left rail appears on desktop only and remains compact, dark, and navigation-focused.

Required content, in order:

1. Gold Harbourview wordmark.
2. Dashboard.
3. Marketplace.
4. Intel Signals.
5. Education.
6. Post Listing.
7. Watchlist.
8. Messages.
9. Support.
10. Country selector or country context.
11. Role selector or role context.

Behavior and styling:

- Active state uses gold text, border, or contained highlight.
- Inactive items use muted text with subtle hover contrast.
- Post Listing may receive a stronger gold-accented treatment than secondary navigation items.
- Country and role context should be compact and utility-like, not a second navigation system.
- Do not add overcrowded top navigation on desktop.

### Main Desktop Grid

Use three major vertical zones:

| Column | Section | Relative emphasis |
|---|---|---|
| Column 1 | Marketplace | Highest practical commercial density |
| Column 2 | Intel Signals | Strong visual differentiator |
| Column 3 | Education | Credible supporting pillar |

Recommended grid weighting:

- Marketplace: `1.15fr` to `1.25fr`.
- Intel Signals: `1fr` to `1.1fr`.
- Education: `0.9fr` to `1fr`.

The exact ratio may adjust by viewport width, but Marketplace should never feel visually subordinate to Intel or Education.

## Column 1: Marketplace

### Section Header

Required header elements:

- Section title: `Marketplace`.
- Text CTA: `View all listings`.
- Optional compact filter icon/button.

### Category Filters

Use horizontal filter chips:

- All.
- Cannabis.
- Equipment.
- Consumables.
- Services.

Chip behavior:

- Active chip uses gold accent with dark fill or subtle gold border.
- Inactive chips use panel/elevated surface with muted text.
- Keep chips compact and scrollable only when space is constrained.

### Listing Card/List Structure

Marketplace should be listing-led, concrete, and browsable. Use compact rows or cards with these fields:

- Listing image.
- Listing title.
- Category tag.
- Verification marker where applicable.
- Location.
- Price or terms.
- Save/bookmark icon.

Example listing content:

- Stainless Steel Mixing Tank 500L.
- Premium Flower — Indoor Grown.
- Nutrient Solution Starter Kit.
- CO₂ Extraction System 50L.
- Child-Resistant Packaging Pouches.
- LED Grow Light.

Recommended row layout:

1. Left: listing thumbnail with rounded corners.
2. Middle: title, category tag, verification marker, and location.
3. Right: price/terms and bookmark control.

### Marketplace CTAs

Primary CTA:

- `Browse all listings`.

Secondary CTAs:

- `Save listing`.
- `View marketplace` where a module-level link is needed.

Marketplace and Post Listing should remain the strongest commercial actions in the dashboard.

## Column 2: Intel Signals

### Section Header

Required header elements:

- Section title: `Intel Signals`.
- Text CTA: `View all signals`.

### Heatmap Globe Module

The globe should be visually memorable but contained within the Intel column.

Required elements:

- Compact heatmap globe.
- Heatmap selector with options such as:
  - Demand.
  - Regulatory.
  - Supply Chain.
  - Market Activity.
- Legend:
  - High.
  - Medium.
  - Low.

Behavior and styling:

- The globe module uses an elevated panel background and thin rounded border.
- Gold accents may identify active selector state, hovered markets, or legend highlights.
- Do not use the globe as a giant decorative dashboard hero.
- Do not imply live automation, daily intelligence, verified intelligence, or production readiness unless separately verified in a control document.

### Signal Feed Structure

Place the signal feed below or beside the globe depending on available column height. Each signal row includes:

- Icon.
- Signal headline.
- Category tag.
- Time indicator.
- Optional chevron.

Example signal categories:

- Market.
- Regulation.
- Compliance.
- Supply Chain.

Recommended signal row hierarchy:

1. Icon or compact category glyph.
2. Headline in primary text.
3. Metadata row with category tag and time indicator.
4. Optional chevron for drill-in.

Intel should read as a curated signal surface, not a fake live command center.

## Column 3: Education

### Section Header

Required header elements:

- Section title: `Education`.
- Text CTA: `View all resources`.

### Education Card Structure

Education cards should look credible, professional, and resource-led. Each card includes:

- Image or icon.
- Resource type label:
  - Course.
  - Guide.
  - Article.
  - Webinar.
- Title.
- Duration or date.
- Difficulty level where useful.

Example resources:

- GMP Essentials for Cannabis Manufacturers.
- Exporting Cannabis from New Zealand.
- The Future of APAC Cannabis Markets.
- EU Market Access: What You Need to Know.

Recommended presentation:

- Use stacked cards with a small image/icon block and compact resource metadata.
- Avoid blog-sidebar styling.
- Avoid decorative popularity metrics, fake certification claims, or fake completion stats.

### Education CTAs

Primary CTA:

- `View all resources`.

Secondary CTA:

- `Open education resource`.

## Mobile Layout Specification

### Mobile Frame

Mobile uses a stacked vertical layout with the following order:

1. Header.
2. Marketplace.
3. Intel Signals.
4. Education.
5. Fixed bottom navigation.

Spacing and shape:

- Page padding: `16px`.
- Card gap: `12px`.
- Panel radius: `16px` to `20px`.
- Listing row height: `96px` to `112px`.
- Bottom nav height: `72px` to `84px`.
- Use fewer rows per module than desktop to avoid cramped text.

### Mobile Header

Required content:

- Gold Harbourview wordmark only.
- Notification icon.
- Account/avatar.
- Optional menu icon.
- Compact country/role context if space allows.

Rules:

- Do not use the compass logo.
- Do not add a large navigation bar above the content.
- Keep header height compact so Marketplace appears immediately.

### Mobile Marketplace

Marketplace appears first and must be usable without leaving the dashboard.

Required elements:

- Marketplace title.
- `View all listings` link.
- Horizontal category chips.
- Compact listing rows.
- Listing images on the left.
- Title, category, verification marker, and location.
- Price/terms on the right.
- Bookmark icon.
- `Browse all listings` CTA.

Mobile behavior:

- Category chips scroll horizontally if needed.
- Listing rows should show the most important listing metadata only.
- Use approximately three to five visible rows before the primary CTA, depending on screen height.

### Mobile Intel Signals

Intel appears after Marketplace.

Required elements:

- Intel Signals title.
- `View all signals` link.
- Compact heatmap globe module.
- Compact legend.
- Three to four signal rows.
- `View all intel signals` CTA.

Mobile behavior:

- The globe must remain compact and contained.
- The globe must not push Marketplace too far down the page.
- Selector controls may compress into segmented pills or a horizontal scroll row.

### Mobile Education

Education appears below Intel.

Required elements:

- Education title.
- `View all resources` link.
- Horizontal or two-column resource cards.
- Course/guide/article/webinar labels.
- Image or icon.
- Title.
- Duration, difficulty, or date.

Mobile behavior:

- Use horizontal card scrolling when preserving card width is more important than showing many resources at once.
- Use two-column cards only if text remains readable and tap targets remain comfortable.

### Mobile Bottom Navigation

Use a fixed bottom navigation with these items:

1. Dashboard.
2. Marketplace.
3. Post Listing.
4. Intel Signals.
5. Education.

Behavior and styling:

- Post Listing is centered and visually prominent.
- Active state uses gold accent.
- Bottom nav uses dark elevated background, thin top border, and safe-area padding.
- Avoid more than five items.

## Component Hierarchy

```text
DashboardShell
├── DesktopLeftRail
│   ├── HarbourviewWordmark
│   ├── PrimaryNavItems
│   ├── CommercialNavItems
│   └── ContextSelectors
├── MobileHeader
│   ├── HarbourviewWordmark
│   ├── NotificationAction
│   ├── AccountAvatar
│   └── OptionalMenuAction
├── DashboardContent
│   ├── MarketplaceSection
│   │   ├── SectionHeader
│   │   ├── CategoryFilterChips
│   │   ├── ListingList
│   │   │   └── ListingCardOrRow
│   │   └── BrowseAllListingsCTA
│   ├── IntelSignalsSection
│   │   ├── SectionHeader
│   │   ├── HeatmapGlobePanel
│   │   │   ├── HeatmapSelector
│   │   │   ├── GlobeViewport
│   │   │   └── HeatmapLegend
│   │   ├── SignalFeed
│   │   │   └── SignalRow
│   │   └── ViewAllSignalsCTA
│   └── EducationSection
│       ├── SectionHeader
│       ├── ResourceCardList
│       │   └── EducationResourceCard
│       └── ViewAllResourcesCTA
└── MobileBottomNavigation
    ├── Dashboard
    ├── Marketplace
    ├── PostListing
    ├── IntelSignals
    └── Education
```

## Responsive Behavior

- Desktop: left rail plus three-column content grid.
- Tablet / narrow desktop: preserve section order and allow columns to rebalance into two columns if necessary, with Marketplace remaining first.
- Mobile: single stacked layout ordered Header, Marketplace, Intel Signals, Education, Bottom Navigation.
- The left rail collapses completely on mobile; mobile navigation is handled by header actions and fixed bottom nav.
- Marketplace category chips become horizontally scrollable when width is constrained.
- The Intel heatmap selector may compress into segmented pills or a horizontal scroll row on smaller widths.
- Resource cards may switch from stacked desktop cards to horizontal carousel or compact two-column mobile cards.
- Avoid hiding Marketplace content behind the globe; Marketplace must remain immediately available on mobile.

## Navigation and CTA Behavior

Primary CTAs:

- `Browse all listings`.
- `Post Listing`.
- `View all signals`.
- `View all resources`.

Secondary CTAs:

- `Save listing`.
- `View marketplace`.
- `View intel signals`.
- `Open education resource`.

CTA rules:

- Do not overuse CTAs inside each module.
- Marketplace and Post Listing should be the strongest commercial actions.
- Header-level text CTAs should remain lightweight and non-disruptive.
- Bookmark/save actions are icon controls and should not compete visually with primary CTAs.

## Color Tokens

| Token | Value |
|---|---:|
| Background primary | `#02070D` |
| Background secondary | `#06101A` |
| Panel background | `#08131F` |
| Panel background elevated | `#0B1826` |
| Border subtle | `rgba(255,255,255,0.08)` |
| Border gold | `rgba(212,164,74,0.45)` |
| Gold primary | `#D9A441` |
| Gold bright | `#F2C46D` |
| Text primary | `#F7F1E6` |
| Text secondary | `#B8C0C8` |
| Text muted | `#6F7A86` |
| Success green | `#6FCF7D` |
| Warning amber | `#D9A441` |
| Risk red | `#D65C4A` |
| Tag blue | `#3B82A0` |
| Tag purple | `#8B5FA8` |

## Explicit Exclusions

Do not add:

- Compass logo beside Harbourview.
- Extra brand symbol, icon mark, or decorative logo treatment beside the wordmark.
- Extra charts, pie charts, large KPI graph blocks, or abstract analytics panels.
- Generic SaaS dashboard cards.
- Pharma market-access workflow as the main model.
- Fake testimonials.
- Fake certification claims.
- Fake automated intelligence claims.
- Fake live automation, payments, subscriptions, verified intelligence, daily signals, or production-readiness claims.
- Overcrowded top navigation.
- A giant decorative globe hero that displaces Marketplace.
- More than the three core dashboard pillars.
- Checkout, cart, direct seller-contact reveal, fake urgency, or active-buyer claims unless separately approved.

## Implementation Boundary

This is a design/specification handoff only. It does not authorize build work, route changes, data model changes, platform claims, or new feature scope. Any future implementation should separately validate copy, compliance language, runtime behavior, and evidence requirements before shipping.
