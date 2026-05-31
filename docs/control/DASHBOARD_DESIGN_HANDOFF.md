# Harbourview Dashboard Design Handoff — Desktop + Mobile

## Purpose

This handoff defines the dashboard layout, component hierarchy, responsive behavior, and visual system for the next Harbourview platform dashboard design pass. It is a specification only: do not treat this document as implementation scope, product entitlement, or approval to add new claims.

The dashboard must present Harbourview as a premium commercial intelligence and marketplace platform. The product structure is intentionally limited to three pillars:

1. Marketplace
2. Intel Signals
3. Education

Marketplace is the primary commercial surface. Intel Signals is the differentiator. Education is a credible supporting pillar.

## Approved visual direction

Use a premium dark navy / near-black interface with restrained gold Harbourview accents.

Harbourview branding is a gold wordmark only. Do not add a compass logo, icon mark, badge, glyph, or extra brand symbol beside the wordmark.

The dashboard should feel serious, commercial, intelligence-led, and marketplace-first. It should not feel like a generic SaaS analytics dashboard or a pharma market-access workflow.

Core visual traits:

- Deep navy / near-black page background.
- Gold wordmark and gold interaction accents.
- Thin rounded card borders.
- Minimal shadows.
- Dense but readable information layout.
- Concrete marketplace listing density.
- Intel heatmap globe as a strong module, not the whole page.
- Education as a visible third pillar.
- No unnecessary graphs, decorative analytics, or fake performance dashboards.

## Desktop layout specification

Desktop uses a compact left rail plus a three-column content grid.

### Desktop shell

- Page background: `#02070D`.
- Outer page padding: `24px` around the content grid.
- Left rail width target: `220px` expanded, `72px` compact variant if a future collapsed state is required.
- Content area: three columns with `16px` gaps.
- Column priority:
  - Column 1, Marketplace: widest practical commercial column.
  - Column 2, Intel Signals: visually strong but not dominant over marketplace.
  - Column 3, Education: narrower than marketplace but substantial enough to feel like a third pillar.
- Recommended desktop grid ratio: `1.25fr 1fr 0.9fr` after the left rail.
- Cards and modules use `14px` to `18px` radius and `1px` subtle borders.

### Left rail

Desktop only. The rail is compact, dark, and navigation-led.

Required contents, top to bottom:

1. Gold Harbourview wordmark.
2. Primary nav:
   - Dashboard
   - Marketplace
   - Intel Signals
   - Education
3. Commercial action:
   - Post Listing
4. Utility nav:
   - Watchlist
   - Messages
   - Support
5. Context controls:
   - Country selector / country context
   - Role selector / role context

Behavior and styling:

- Active item uses gold text or gold left indicator with a restrained dark elevated background.
- Hover/focus states use the gold border or gold text accent, not large filled buttons except for Post Listing.
- Post Listing should be visually stronger than secondary rail items, but it should not overpower the three main pillars.
- Country and role context should read as state/context selectors, not marketing claims.

## Main desktop grid

### Column 1 — Marketplace

Marketplace is the primary commercial browsing zone and should carry the highest practical information density.

Header row:

- Section title: `Marketplace`.
- Secondary text link CTA: `View all listings`.
- Optional filter icon/button aligned with the chip row or header right.

Category chips:

- All
- Cannabis
- Equipment
- Consumables
- Services

Listing presentation:

- Use compact cards or list rows.
- Target row height: `92px` to `120px`.
- Each row should feel scannable and purchasable without implying checkout, payment, or direct seller exposure.

Required listing fields:

- Listing image.
- Listing title.
- Category tag.
- Verification marker where applicable.
- Location.
- Price / terms.
- Save/bookmark icon.

Approved example listing types:

- Stainless Steel Mixing Tank 500L
- Premium Flower — Indoor Grown
- Nutrient Solution Starter Kit
- CO₂ Extraction System 50L
- Child-Resistant Packaging Pouches
- LED Grow Light

Primary marketplace CTA:

- `Browse all listings`

Marketplace design intent:

- Make browsing and commercial discovery obvious.
- Use real listing structure rather than abstract opportunity cards.
- Avoid revenue charts, KPI tiles, market sizing panels, or generic analytics in this column.

### Column 2 — Intel Signals

Intel Signals should be differentiated and memorable without displacing marketplace.

Header row:

- Section title: `Intel Signals`.
- Secondary text link CTA: `View all signals`.

Heatmap globe module:

- Contained inside a bordered panel.
- Strong enough to be visually recognizable.
- Not a full-page hero and not taller than the combined marketplace list unless the content grid still keeps marketplace first in perceived priority.
- Use dark ocean/navy styling with restrained gold or amber activity highlights.

Heatmap selector:

- Demand
- Regulatory
- Supply Chain
- Market Activity

Legend:

- High
- Medium
- Low

Legend styling:

- High: gold bright or warm amber.
- Medium: muted gold/amber.
- Low: subdued navy/gray marker.

Signal feed:

- Place below the globe on standard desktop.
- If viewport height is constrained, signals may sit beside a smaller globe inside Column 2, but the module must remain readable.

Required signal row fields:

- Icon.
- Signal headline.
- Category tag.
- Time indicator.
- Optional chevron.

Approved signal categories:

- Market
- Regulation
- Compliance
- Supply Chain

Intel design intent:

- Signal rows should read as reviewed intelligence summaries, not automated live alerts.
- Do not claim live automation, daily intelligence, verified intelligence, or production readiness unless separately verified in a control document.
- Keep the globe contained and purposeful.

### Column 3 — Education

Education must be a strong third pillar, not a blog sidebar.

Header row:

- Section title: `Education`.
- Secondary text link CTA: `View all resources`.

Resource card structure:

- Image or icon.
- Resource type label:
  - Course
  - Guide
  - Article
  - Webinar
- Title.
- Duration or date.
- Difficulty level where useful.

Approved example resources:

- GMP Essentials for Cannabis Manufacturers
- Exporting Cannabis from New Zealand
- The Future of APAC Cannabis Markets
- EU Market Access: What You Need to Know

Education design intent:

- Cards should feel professional and operationally useful.
- Avoid casual blog styling, decorative thumbnails, fake certifications, or claims about credentialing.
- Education should be visually subordinate to marketplace but clearly more than a footer list.

## Mobile layout specification

Mobile uses a stacked vertical layout with a fixed bottom navigation.

Mobile order:

1. Header
2. Marketplace
3. Intel Signals
4. Education
5. Bottom navigation

### Mobile header

Required contents:

- Gold Harbourview wordmark only.
- Notification icon.
- Account/avatar.
- Optional menu icon.
- Compact country/role context if space allows.

Behavior and styling:

- Keep the header compact enough that marketplace content appears early.
- Do not add a compass logo or any brand icon.
- Country/role context may collapse into a compact pill below the wordmark when horizontal space is limited.

### Mobile Marketplace

Marketplace appears first and must be usable without opening another page.

Required contents:

- Marketplace title.
- `View all listings` link.
- Horizontal category chips.
- Compact listing rows.
- Listing images on the left.
- Title, category, verification, and location in the center.
- Price / terms on the right where space allows.
- Bookmark icon.
- `Browse all listings` CTA.

Mobile marketplace rules:

- Target row height: `96px` to `112px`.
- Show fewer rows than desktop, but enough to communicate concrete marketplace inventory.
- Category chips scroll horizontally if needed.
- Price may wrap below title on very small widths, but it must remain visible in the row.

### Mobile Intel Signals

Intel appears after marketplace.

Required contents:

- Intel Signals title.
- `View all signals` link.
- Compact heatmap globe module.
- Compact legend.
- 3–4 signal rows.
- `View all intel signals` CTA.

Mobile intel rules:

- The globe is compact and contained.
- The globe must not push marketplace below the fold as a decorative hero.
- Signal rows should remain readable with clear category and time metadata.

### Mobile Education

Education appears below Intel Signals.

Required contents:

- Education title.
- `View all resources` link.
- Horizontal card rail or two-column resource grid.
- Course, guide, article, or webinar labels.
- Image or icon.
- Title.
- Duration, difficulty, or date.

Mobile education rules:

- Use a horizontal rail when preserving card width is more important than showing many items.
- Use a two-column grid only when titles remain readable and tap targets remain reliable.

### Mobile bottom navigation

Use a fixed bottom nav with height `72px` to `84px`.

Items:

- Dashboard
- Marketplace
- Post Listing
- Intel Signals
- Education

Behavior and styling:

- Post Listing is centered and visually prominent.
- Active states use gold accents.
- Bottom nav must not include extra sections beyond the five approved items.
- Ensure content has bottom padding so the fixed nav does not cover the final resource cards.

## Component hierarchy

Recommended hierarchy:

```text
DashboardShell
├─ DesktopLeftRail
│  ├─ HarbourviewWordmark
│  ├─ PrimaryNav
│  ├─ PostListingAction
│  ├─ UtilityNav
│  └─ ContextSelectors
├─ MobileHeader
│  ├─ HarbourviewWordmark
│  ├─ HeaderActions
│  └─ OptionalContextPill
├─ DashboardContentGrid
│  ├─ MarketplaceSection
│  │  ├─ SectionHeader
│  │  ├─ CategoryChipFilter
│  │  ├─ ListingCardList
│  │  └─ BrowseListingsCTA
│  ├─ IntelSignalsSection
│  │  ├─ SectionHeader
│  │  ├─ HeatmapGlobePanel
│  │  ├─ HeatmapSelector
│  │  ├─ HeatmapLegend
│  │  ├─ SignalFeed
│  │  └─ ViewIntelCTA
│  └─ EducationSection
│     ├─ SectionHeader
│     ├─ ResourceCardList
│     └─ ViewResourcesCTA
└─ MobileBottomNav
```

Component notes:

- SectionHeader standardizes title plus secondary text link.
- CategoryChipFilter is shared only where it does not dilute marketplace priority.
- Cards should use common panel styling but retain content-specific density.
- Icons must be functional, not decorative brand marks.

## Responsive behavior

Breakpoints and layout behavior:

- Large desktop: left rail plus three-column grid.
- Medium desktop / tablet landscape: left rail may compact; content grid can shift to two columns with Marketplace spanning or leading the first column and Education moving below Intel.
- Tablet portrait: no left rail unless there is enough width; use stacked sections with Marketplace first.
- Mobile: stacked sections, fixed bottom navigation, no desktop rail.

Priority rules:

1. Marketplace remains first in reading order and visual priority.
2. Intel Signals remains second and keeps the contained globe module.
3. Education remains third and visible before low-priority utility content.
4. Post Listing remains the strongest persistent commercial action after Browse all listings.

Density rules:

- Reduce the number of visible rows/cards before reducing metadata quality.
- Preserve title, category, location, and price/terms for marketplace rows.
- Preserve headline, category, and time for signal rows.
- Preserve type label and title for education cards.

## Navigation and CTA behavior

Primary CTAs:

- `Browse all listings`
- `Post Listing`
- `View all signals`
- `View all resources`

Secondary CTAs:

- `Save listing`
- `View marketplace`
- `View intel signals`
- `Open education resource`

CTA hierarchy:

- Marketplace and Post Listing are strongest commercial actions.
- View all links should be restrained text links or subtle gold-accent buttons.
- Do not overuse filled gold buttons; reserve strong treatment for primary commercial movement.
- Save/bookmark actions must be secondary icon controls with accessible labels.

## Color tokens

| Token | Value | Use |
|---|---:|---|
| Background primary | `#02070D` | Page background |
| Background secondary | `#06101A` | Rail or secondary page fields |
| Panel background | `#08131F` | Cards and modules |
| Panel background elevated | `#0B1826` | Active panels and raised cards |
| Border subtle | `rgba(255,255,255,0.08)` | Default card borders |
| Border gold | `rgba(212,164,74,0.45)` | Active/focus/selected borders |
| Gold primary | `#D9A441` | Brand wordmark and primary accents |
| Gold bright | `#F2C46D` | Highlight and active heatmap emphasis |
| Text primary | `#F7F1E6` | Main text |
| Text secondary | `#B8C0C8` | Supporting text |
| Text muted | `#6F7A86` | Metadata and disabled text |
| Success green | `#6FCF7D` | Verified/success status only |
| Warning amber | `#D9A441` | Caution or medium signal |
| Risk red | `#D65C4A` | Risk or high-friction status |
| Tag blue | `#3B82A0` | Market/supply tags |
| Tag purple | `#8B5FA8` | Education or specialty tags |

## Spacing and shape tokens

Desktop:

- Outer page padding: `24px`.
- Card gap: `12px` to `16px`.
- Panel radius: `14px` to `18px`.
- Listing row height: `92px` to `120px`.
- Border width: `1px`.
- Shadows: minimal and low-opacity only.

Mobile:

- Page padding: `16px`.
- Card gap: `12px`.
- Panel radius: `16px` to `20px`.
- Listing row height: `96px` to `112px`.
- Bottom nav height: `72px` to `84px`.
- Use fewer rows per module to avoid cramped text.

## Explicit exclusions

Do not add:

- Compass logo beside Harbourview.
- Any extra brand icon, mark, glyph, or symbol beside the wordmark.
- Extra charts.
- Large KPI graph blocks.
- Generic SaaS cards.
- Pharma market-access workflow as the main model.
- Fake testimonials.
- Fake certification claims.
- Fake automated intelligence claims.
- Fake live automation, payments, subscriptions, verified intelligence, daily signals, or production-readiness claims.
- Overcrowded top navigation.
- A giant decorative globe hero that displaces marketplace.
- More than the three dashboard pillars: Marketplace, Intel Signals, Education.
- Implementation instructions that expand product scope beyond this handoff.
