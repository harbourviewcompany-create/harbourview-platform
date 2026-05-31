# Harbourview Dashboard Design Handoff — Desktop + Mobile

## Purpose

This document defines a design/spec pass for the Harbourview platform dashboard using the approved desktop and mobile visual direction. It is a layout, component hierarchy, responsive behavior, and content-structure handoff only.

This document does **not** authorize implementation, expand product scope, or introduce new platform claims.

## Design Principles

- Use a premium dark navy / near-black interface with restrained gold Harbourview accents.
- Use the Harbourview gold wordmark only. Do not add a compass logo, icon mark, or extra brand symbol beside the wordmark.
- Maintain a serious commercial intelligence and marketplace platform tone rather than a generic SaaS dashboard tone.
- Keep the marketplace concrete, listing-led, and commercially useful.
- Treat intel as the differentiator, with the heatmap globe as a strong module that does not consume the full dashboard.
- Treat education as a visible third pillar, not a blog sidebar.
- Avoid decorative analytics, unnecessary charts, fake automation claims, or pharma-only market-access workflow framing.

## Core Product Structure

The dashboard contains exactly three primary content pillars:

1. **Marketplace** — primary commercial section.
2. **Intel Signals** — differentiated intelligence section.
3. **Education** — credible supporting section.

The dashboard must not add additional top-level pillars in this design pass.

## Desktop Layout Specification

### Desktop Frame

- Use a compact fixed left rail plus a three-column main content grid.
- Recommended desktop page padding: `24px`.
- Recommended card gap: `12px` to `16px`.
- Use panel radii between `14px` and `18px`.
- Use thin borders and minimal shadow treatment.
- Prioritize dense but readable content over decorative whitespace.

### Left Rail

The left rail is desktop-only and should be compact, dark, and navigation-led.

Required elements, in order:

1. Gold Harbourview wordmark.
2. Dashboard.
3. Marketplace.
4. Intel Signals.
5. Education.
6. Post Listing.
7. Watchlist.
8. Messages.
9. Support.
10. Country selector / country context.
11. Role selector / role context.

Behavior and styling:

- Active state uses gold text, gold indicator, or subtle gold border treatment.
- Non-active navigation uses muted text on dark background.
- Country and role context should be visually secondary to the main navigation.
- Do not place a compass, icon mark, or extra symbol beside the wordmark.

### Main Desktop Grid

Use three major vertical zones:

| Column | Section | Relative intent |
|---|---|---|
| 1 | Marketplace | Highest commercial density and practical browsing utility |
| 2 | Intel Signals | Differentiated intelligence with heatmap globe and signal feed |
| 3 | Education | Credible resource pillar with professional resource cards |

Columns should remain balanced, but Marketplace should feel like the primary commercial action area.

## Column 1 — Marketplace

### Marketplace Header

Required header elements:

- Section title: `Marketplace`.
- Secondary text link or compact CTA: `View all listings`.
- Optional filter icon/button.

### Category Filters

Use horizontal chips:

- All
- Cannabis
- Equipment
- Consumables
- Services

Chip behavior:

- Selected chip uses gold accent fill, gold text, or gold border.
- Unselected chips use dark elevated backgrounds and subtle borders.
- Chips should wrap only if necessary; otherwise keep a single compact row.

### Listing Card / Row Structure

Marketplace should use compact listing rows or cards with practical commercial density.

Required fields:

- Listing image.
- Listing title.
- Category tag.
- Verification marker where applicable.
- Location.
- Price / terms.
- Save/bookmark icon.

Recommended example listing types:

- Stainless Steel Mixing Tank 500L.
- Premium Flower — Indoor Grown.
- Nutrient Solution Starter Kit.
- CO₂ Extraction System 50L.
- Child-Resistant Packaging Pouches.
- LED Grow Light.

Sizing guidance:

- Desktop listing row height: `92px` to `120px`.
- Listing image should sit on the left and remain large enough to distinguish category/type.
- Price / terms should be visually scannable but not louder than the listing title.
- Bookmark should be a secondary action with a gold hover/focus state.

### Marketplace CTA

Primary marketplace CTA:

- `Browse all listings`.

CTA behavior:

- This should be one of the strongest dashboard actions.
- Use gold accent styling or a high-contrast filled treatment.
- Do not introduce checkout, cart, direct payment, or direct seller-contact language.

## Column 2 — Intel Signals

### Intel Header

Required header elements:

- Section title: `Intel Signals`.
- Secondary text link or compact CTA: `View all signals`.

### Heatmap Globe Module

Required module elements:

- Contained heatmap globe visualization.
- Heatmap selector.
- Legend.

Heatmap selector examples:

- Demand.
- Regulatory.
- Supply Chain.
- Market Activity.

Legend levels:

- High.
- Medium.
- Low.

Design guidance:

- The globe should be a memorable module, not a full-page hero.
- Keep the globe inside a bordered elevated panel.
- Use gold and restrained heat colors without bright sci-fi glow.
- Avoid route-line clutter, fake live indicators, and unsupported automation language.

### Signal Feed

Place the signal feed below or beside the globe depending on available column width.

Required signal row fields:

- Icon.
- Signal headline.
- Category tag.
- Time indicator.
- Optional chevron.

Recommended signal categories:

- Market.
- Regulation.
- Compliance.
- Supply Chain.

Design guidance:

- Rows should look like reviewed signal summaries, not alerts from an automated live monitoring system.
- Time labels should be simple and not imply unsupported real-time or daily-signal claims.
- Do not allow intel to crowd out marketplace browsing.

## Column 3 — Education

### Education Header

Required header elements:

- Section title: `Education`.
- Secondary text link or compact CTA: `View all resources`.

### Education Resource Cards

Resource cards should feel credible, professional, and purpose-built for commercial operators.

Required fields:

- Image or icon.
- Resource type label.
- Title.
- Duration or date.
- Difficulty level where useful.

Allowed resource type labels:

- Course.
- Guide.
- Article.
- Webinar.

Recommended example cards:

- GMP Essentials for Cannabis Manufacturers.
- Exporting Cannabis from New Zealand.
- The Future of APAC Cannabis Markets.
- EU Market Access: What You Need to Know.

Design guidance:

- Cards may be stacked vertically on desktop or arranged as compact tiles when width allows.
- Resource type label should be visible but secondary to the title.
- Education must not read as a generic blog sidebar.

## Mobile Layout Specification

### Mobile Frame

Mobile uses a stacked vertical layout in this order:

1. Header.
2. Marketplace.
3. Intel Signals.
4. Education.
5. Fixed bottom navigation.

Spacing and shape guidance:

- Page padding: `16px`.
- Card gap: `12px`.
- Panel radius: `16px` to `20px`.
- Listing row height: `96px` to `112px`.
- Bottom nav height: `72px` to `84px`.
- Avoid cramped text; reduce visible row counts before reducing readability.

### Mobile Header

Required elements:

- Gold Harbourview wordmark only.
- Notification icon.
- Account/avatar.
- Optional menu icon.
- Compact country/role context if space allows.

Rules:

- Do not use the compass logo.
- Keep the header compact so Marketplace appears high on the screen.
- Country/role context should collapse or move below the wordmark if horizontal space is constrained.

### Mobile Marketplace

Marketplace appears first and must be usable without opening another page.

Required elements:

- Marketplace title.
- `View all listings` link or compact CTA.
- Horizontal category chips.
- Compact listing rows.
- `Browse all listings` CTA.

Mobile listing row structure:

- Listing image on the left.
- Title, category, verification marker, and location in the center.
- Price / terms on the right where space permits.
- Bookmark icon as a secondary action.

Guidance:

- Show fewer rows than desktop, but maintain concrete listing examples.
- Preserve price visibility for commercial scanning.
- Category chips should horizontally scroll if needed.

### Mobile Intel Signals

Intel appears after Marketplace.

Required elements:

- Intel Signals title.
- `View all signals` link or compact CTA.
- Contained heatmap globe module.
- Compact legend.
- Three to four signal rows.
- `View all intel signals` CTA.

Guidance:

- The globe should be compact and contained.
- The globe must not push Marketplace too far down the page.
- Signal rows should remain legible and avoid dense metadata.

### Mobile Education

Education appears below Intel.

Required elements:

- Education title.
- `View all resources` link or compact CTA.
- Horizontal or two-column resource cards.
- Course/guide/article/webinar labels.
- Image or icon.
- Title.
- Duration, difficulty, or date.

Guidance:

- Use horizontal scrolling cards when preserving readable card width is more important than showing all cards at once.
- Use two-column cards only if title wrapping remains readable.

### Mobile Bottom Navigation

Use a fixed bottom nav with five items:

1. Dashboard.
2. Marketplace.
3. Post Listing.
4. Intel Signals.
5. Education.

Behavior and styling:

- `Post Listing` is centered and visually prominent.
- Active state uses gold accent styling.
- Bottom nav must not cover content; add bottom padding to the scroll container.
- Icons, if used, must be generic UI icons and not extra Harbourview brand marks.

## Component Hierarchy

```txt
DashboardShell
├─ DesktopLeftRail
│  ├─ HarbourviewWordmark
│  ├─ PrimaryNavigation
│  ├─ UtilityNavigation
│  └─ ContextSelectors
├─ MobileHeader
│  ├─ HarbourviewWordmark
│  ├─ CountryRoleContext
│  └─ HeaderActions
├─ DashboardMain
│  ├─ MarketplaceSection
│  │  ├─ SectionHeader
│  │  ├─ CategoryChipGroup
│  │  ├─ ListingCollection
│  │  │  └─ ListingCardOrRow
│  │  └─ PrimarySectionCTA
│  ├─ IntelSignalsSection
│  │  ├─ SectionHeader
│  │  ├─ HeatmapGlobePanel
│  │  │  ├─ HeatmapSelector
│  │  │  ├─ GlobeVisualization
│  │  │  └─ HeatmapLegend
│  │  ├─ SignalFeed
│  │  │  └─ SignalRow
│  │  └─ SecondarySectionCTA
│  └─ EducationSection
│     ├─ SectionHeader
│     ├─ ResourceCollection
│     │  └─ EducationResourceCard
│     └─ SecondarySectionCTA
└─ MobileBottomNavigation
```

## Responsive Behavior

| Breakpoint context | Behavior |
|---|---|
| Desktop / wide tablet | Show fixed left rail and three-column main grid. |
| Medium tablet | Collapse to two columns if needed: Marketplace spans wider first row; Intel and Education can sit below or beside based on available width. |
| Mobile | Hide left rail, show mobile header, stack Marketplace, Intel, Education, and fixed bottom nav. |

Additional responsive rules:

- Marketplace remains first at all sizes.
- Intel remains second on mobile.
- Education remains third on mobile.
- Reduce the number of visible rows/cards before shrinking type below readable sizes.
- Keep touch targets accessible on mobile.
- Preserve visible focus states for chips, links, cards, and navigation controls.

## Navigation and CTA Behavior

Primary CTAs:

- `Browse all listings`.
- `Post Listing`.
- `View all signals`.
- `View all resources`.

Secondary CTAs:

- Save listing.
- View marketplace.
- View intel signals.
- Open education resource.

CTA rules:

- Marketplace and Post Listing remain the strongest commercial actions.
- Do not overuse filled buttons; use compact text links for section-level “view all” actions where appropriate.
- Save/bookmark is a secondary action and should not compete with Browse or Post Listing.
- Do not add checkout, cart, payments, subscription, guaranteed matching, verified-intelligence, or live automation CTAs.

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

## Spacing and Shape Tokens

| Token | Desktop | Mobile |
|---|---:|---:|
| Outer page padding | `24px` | `16px` |
| Card gap | `12px` to `16px` | `12px` |
| Panel radius | `14px` to `18px` | `16px` to `20px` |
| Listing row height | `92px` to `120px` | `96px` to `112px` |
| Bottom nav height | Not applicable | `72px` to `84px` |

## Explicit Exclusions

Do not add:

- Compass logo beside Harbourview.
- Any extra brand icon mark beside the wordmark.
- Extra charts, large KPI graph blocks, pie charts, or decorative analytics panels.
- Generic SaaS cards.
- Pharma market-access workflow as the main dashboard model.
- Fake testimonials.
- Fake certification claims.
- Fake automated intelligence claims.
- Claims about live automation, payments, subscriptions, verified intelligence, daily signals, or production readiness unless separately verified and approved.
- Overcrowded top navigation.
- A giant decorative globe hero that displaces Marketplace.
- More than the three core dashboard pillars.
- Implementation or code requirements in this handoff.

## Handoff Status

- Status: Design/spec only.
- Implementation authorization: Not included.
- Product scope change: Not included.
- New platform claims: Not included.
