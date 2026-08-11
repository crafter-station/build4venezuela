---
shaping: true
status: selected
shape: B
---

# Build4Venezuela Civic OS Redesign

## Source

> let's think of a redesign. use emil kowalski skills. let's define a design system. let's use layout from pages like dub.co, cal.com, etc. and let's also find references of pages with projects and data uis. i dont like our website right now. let's improve everything. a full redesign. and let's consider light/dark mode.

## Frame

### Problem

Build4Venezuela currently applies its poster language to the campaign homepage, application shell, directories, forms, and data interfaces with nearly equal intensity. The identity is distinctive, but repeated uppercase mono type, hard borders, pure black surfaces, and similarly weighted sections make the product difficult to scan and make unrelated workflows feel visually identical.

Projects, builders, requests, resources, and impact also read as separate destinations rather than parts of one community system.

### Outcome

Build4Venezuela feels like a connected civic operating system:

`Builders contribute to Projects -> Projects publish Needs -> Resources unblock work -> Updates produce Impact.`

The redesign preserves the movement's editorial identity while making discovery, contribution, comparison, and evidence easier across six locales, two themes, and all viewport sizes.

## Requirements (R)

| ID | Requirement | Status |
|---|---|---|
| R0 | Make projects, people, needs, resources, and impact feel like one connected product | Core goal |
| R1 | Preserve recognizable Build4Venezuela identity without making every screen visually loud | Must-have |
| R2 | Make browsing and comparing projects substantially faster on desktop and mobile | Must-have |
| R3 | Establish one coherent component and token system across marketing, directories, forms, and data views | Must-have |
| R4 | Support complete, accessible light and dark themes rather than a cosmetic inversion | Must-have |
| R5 | Support six locales, long content, CJK text, and locale-preserving navigation | Must-have |
| R6 | Surface real community activity, current needs, and impact evidence early instead of generic marketing claims | Must-have |
| R7 | Preserve authenticated workflows, ownership rules, filters, voting, comments, matching, and data density | Must-have |
| R8 | Use restrained, purposeful motion that improves feedback and spatial understanding | Must-have |

## Selected Shape B: Civic OS

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Replace the campaign-style shell with a calm product shell: compact header, universal search, entity navigation, locale, create menu, and account | |
| B2 | Use a dual-layer visual language: editorial poster moments for identity and neutral product surfaces for repeated work | |
| B3 | Rebuild the homepage around live inventory: search, proof metrics, featured projects, urgent needs, builders, recent activity, and impact | |
| B4 | Give projects, builders, needs, and resources a shared discovery grammar while preserving entity-specific metadata | |
| B5 | Connect detail pages through contribution, team, current-needs, update, evidence, and related-entity modules | |
| B6 | Build semantic light/dark tokens, chart palettes, elevation, overlays, and asset rules from the start | |
| B7 | Make filters URL-backed; use grid/table switching on desktop and purpose-built compact rows on mobile | |
| B8 | Define crisp motion defaults: 100-200ms feedback, origin-aware overlays, active press states, no decorative motion in repeated workflows | |

## Fit Check: R x B

| Req | Requirement | Status | B |
|---|---|---|:---:|
| R0 | Make projects, people, needs, resources, and impact feel like one connected product | Core goal | ✅ |
| R1 | Preserve recognizable Build4Venezuela identity without making every screen visually loud | Must-have | ✅ |
| R2 | Make browsing and comparing projects substantially faster on desktop and mobile | Must-have | ✅ |
| R3 | Establish one coherent component and token system across marketing, directories, forms, and data views | Must-have | ✅ |
| R4 | Support complete, accessible light and dark themes rather than a cosmetic inversion | Must-have | ✅ |
| R5 | Support six locales, long content, CJK text, and locale-preserving navigation | Must-have | ✅ |
| R6 | Surface real community activity, current needs, and impact evidence early instead of generic marketing claims | Must-have | ✅ |
| R7 | Preserve authenticated workflows, ownership rules, filters, voting, comments, matching, and data density | Must-have | ✅ |
| R8 | Use restrained, purposeful motion that improves feedback and spatial understanding | Must-have | ✅ |

## Product Principles

1. **Inventory before explanation.** Show real projects, needs, people, and activity within the first two homepage viewports.
2. **Identity in moments, not everywhere.** Poster typography and national color create emphasis; they do not style every control.
3. **Relationships are navigation.** Every project connects to people, needs, resources, updates, and evidence.
4. **Density follows the job.** Marketing is spacious, directories are efficient, and data tables are compact.
5. **Evidence carries context.** Metrics include definition, period, source, freshness, and verification state.
6. **Themes are equal products.** Light and dark preserve hierarchy and semantic meaning independently.
7. **Motion explains or confirms.** Repeated actions remain fast; decorative motion is reserved for rare editorial moments.

## Reference Synthesis

| Reference | Borrow | Do not copy |
|---|---|---|
| [Dub](https://dub.co/) | Compact hierarchy, realistic product panels, metric cards, dense analytics controls | Long repetitive marketing page and generic monochrome brand |
| [Cal.com](https://cal.com/) | Progressive disclosure, localization, responsive forms, calm product surfaces | Repeated feature/testimonial rhythm |
| [Devpost](https://devpost.com/software) | Project discovery taxonomy and detail-page narrative | Dated cards and popularity-first ranking |
| [Open Collective](https://opencollective.com/search) | Public activity, contributors, updates, transparency, entity search | Very long financially dominated detail pages |
| [ADPList](https://adplist.org/explore?tab=mentors) | Scannable people directory, expertise, location, availability | Excessive chip density and social-proof noise |
| [Contra](https://contra.com/discover?view=people) | Profile storytelling, portfolio previews, direct contact | Commercial marketplace visual weight |
| [Our World in Data](https://ourworldindata.org/explorers) | URL-backed explorer state, chart/map/table, methodology and downloads | Full research-tool complexity on general pages |
| [NYC Open Data Project Gallery](https://opendata.cityofnewyork.us/projects/) | Civic project framing, attribution, categories, sharing | Weak filters and long mobile cards |

## Visual Language

### Dual Layer

**Movement layer**

- Used for the homepage hero, campaign calls to action, country moments, editorial dividers, and impact milestones.
- Input Mono Narrow, uppercase display type, map/grid motifs, oversized numerals, hard graphic crops, and selective Venezuelan yellow/blue/red.
- May use square frames and stronger contrast.

**Product layer**

- Used for navigation, search, directories, project details, forms, comments, inboxes, and dashboards.
- Proportional sans for reading and controls; mono for labels, statuses, IDs, dates, and tabular numerals.
- Uses quiet surfaces, modest radii, precise borders, and limited accent color.

The layers share tokens and components. They are emphasis modes, not separate websites.

## Foundations

### Typography

| Token | Typeface | Size / line-height | Use |
|---|---|---|---|
| `display-2xl` | Input Mono Narrow 900 | `clamp(3.5rem, 8vw, 7.5rem)` / `.84` | Rare hero statements |
| `display-xl` | Input Mono Narrow 900 | `clamp(2.75rem, 5vw, 5rem)` / `.88` | Major editorial sections |
| `heading-lg` | Geist Sans 650-700 | `clamp(2rem, 3vw, 3rem)` / `1.05` | Page titles |
| `heading-md` | Geist Sans 650-700 | `1.5rem` / `1.15` | Section titles |
| `heading-sm` | Geist Sans 600 | `1.125rem` / `1.3` | Cards and panels |
| `body-lg` | Geist Sans 400 | `1.125rem` / `1.65` | Introductions |
| `body-md` | Geist Sans 400 | `1rem` / `1.55` | Default content |
| `body-sm` | Geist Sans 400-500 | `.875rem` / `1.5` | Secondary content |
| `label` | Input Mono Narrow 700 | `.75rem` / `1rem` | Metadata and controls; uppercase optional |
| `data` | Input Mono Narrow 500-700 | Contextual / tabular | Metrics, dates, IDs, charts |

Rules:

- Sentence case is the default in product UI.
- Uppercase is limited to short labels, statuses, and editorial display text.
- Body text never uses wide letter spacing.
- CJK locales use a tested locale-appropriate fallback instead of forced narrow mono glyphs.
- Text containers tolerate 30-40% expansion without clipping.

### Color

Semantic tokens are the API. Components never choose raw palette values.

| Token | Light | Dark | Role |
|---|---|---|---|
| `canvas` | `#F7F6F2` | `#10100F` | App background |
| `surface` | `#FFFFFF` | `#171716` | Cards and controls |
| `surface-raised` | `#FFFFFF` | `#1D1D1B` | Popovers and floating panels |
| `surface-subtle` | `#EFEEE9` | `#22221F` | Secondary grouped areas |
| `ink` | `#171714` | `#F4F3EE` | Primary text |
| `ink-muted` | `#66665F` | `#A8A79F` | Secondary text |
| `line` | `#DCDAD2` | `#343430` | Default border |
| `line-strong` | `#B8B5AA` | `#52524C` | Emphasized boundary |
| `brand-yellow` | `#F3C623` | `#FFD83D` | Primary brand/action accent |
| `brand-blue` | `#2457D6` | `#6D96FF` | Links and informational accents |
| `brand-red` | `#D83D4C` | `#FF6875` | Urgency and brand accents |
| `success` | `#16734B` | `#56C995` | Positive/completed |
| `warning` | `#8A5A00` | `#F0B84B` | Attention |
| `danger` | `#C52D3A` | `#FF6875` | Destructive/error |
| `focus` | `#2457D6` | `#FFD83D` | Keyboard focus |

Rules:

- Yellow is not used for body text on light surfaces.
- Red is not the only urgency cue; icon and label are required.
- Charts use a separate colorblind-safe categorical and sequential palette.
- Background grid and map treatments use theme-aware low-contrast ink, never fixed white.
- User-selectable theme defaults to system preference and persists without a flash of the wrong theme.

### Spacing And Layout

- Base spacing unit: `4px`.
- Common steps: `4, 8, 12, 16, 24, 32, 48, 64, 96`.
- App shell max width: `1280px`; reading width: `720px`; wide data width: `1440px` when needed.
- Page gutters: `16px` mobile, `24px` tablet, `32px` desktop, `48px` wide desktop.
- Desktop grid: 12 columns with `24px` gutters.
- Section spacing: `64px` mobile, `96px` desktop; compact product sections use `32-48px`.
- Sticky header: `64px` desktop and `56px` mobile.

### Shape And Elevation

| Element | Radius | Treatment |
|---|---:|---|
| Product card/panel | `12px` | 1px border, surface fill |
| Control/button/input | `8px` | Clear hover/focus/pressed states |
| Popover/dialog | `12-16px` | Raised surface, border, restrained shadow |
| Filter/status chip | Full | Compact, never used for long prose |
| Poster/editorial frame | `0-4px` | Intentional exception for brand contrast |

Use borders for structure and shadows only for floating layers. Avoid glow, heavy glass blur, and nested bordered boxes.

### Iconography

- Continue with Phosphor icons.
- Default icon weight: regular; active/emphasis: bold.
- Standard sizes: `16px` in compact controls, `20px` in standard controls, `24px` for standalone actions.
- Every unfamiliar icon receives a tooltip and accessible label.

## Motion

### Decision Rules

1. Repeated keyboard actions and route changes are instant.
2. Hover and color feedback uses `120-160ms ease`.
3. Popovers, menus, and tooltips use `140-180ms` strong ease-out and originate from their trigger.
4. Dialogs and sheets use `200-260ms`; exits are faster than entrances.
5. Buttons compress to `scale(.97)` for `100-140ms` on press.
6. Entering UI begins near its final state, never at `scale(0)`.
7. Prefer CSS transitions for interruptible UI and transform/opacity for performance.
8. Reduced motion removes travel and scale while retaining short opacity/color feedback.
9. Hover motion only runs under `(hover: hover) and (pointer: fine)`.

Motion personality is crisp and civic, not playful. No global page transitions, scroll-jacking, perpetual marquees, or stagger that blocks interaction.

## Core Components

### Navigation

- `AppHeader`: logo, primary entity navigation, universal search, locale, theme, create menu, account.
- `MobileNavSheet`: full-height navigation with clear signed-in and signed-out states.
- `CreateMenu`: Add project, post need, share resource, register/update builder profile.
- `CommandSearch`: unified entity search with keyboard access and recent searches.
- `Breadcrumbs`: details and settings only; omitted where hierarchy is already obvious.
- `SectionTabs`: overview, needs, updates, impact, team where applicable.

### Actions And Inputs

- Button variants: primary, secondary, outline, ghost, danger, text.
- Sizes: compact `32px`, default `40px`, prominent `48px`.
- Search field, standard input, textarea, select, combobox, date control, segmented control, toggle, checkbox, radio.
- Fields always provide label, description/error slot, and stable vertical geometry.
- Loading buttons preserve width and replace content without layout shift; use subtle blur only when a state swap otherwise looks discontinuous.

### Discovery

- `EntitySearchBar`: query, entity switcher, result count.
- `FilterBar`: common filters, active count, clear all, sort, view switcher.
- `FilterSheet`: mobile bottom sheet; apply and reset remain sticky.
- `ActiveFilter`: removable chip with readable value.
- `ProjectCard`, `BuilderCard`, `NeedCard`, `ResourceRow`: shared shell and entity-specific metadata.
- `CompactEntityRow`: mobile and dense desktop alternative to wide tables.
- `DataTable`: sticky header, sorting, optional column controls, row actions.
- `EmptyState`: explains why no result exists and offers a recovery action.

### Trust And Activity

- `MetricCard`: value, label, period, trend/context, definition tooltip.
- `EvidenceBadge`: self-reported, community-reviewed, or verified with non-color cues.
- `Freshness`: last updated plus stale-state treatment.
- `ActivityItem`: actor, action, entity, timestamp, and optional context.
- `UpdateCard`: progress narrative, evidence, attachments, date, author.
- `SourceNote`: definition, source, reporting period, and download link.

### Feedback And Overlays

- Toast, tooltip, popover, dropdown, dialog, drawer, confirmation dialog, skeleton, progress, inline notice.
- Popovers use origin-aware transforms.
- Tooltips delay the first appearance and become instant while traversing a group.
- Destructive confirmation names the affected entity and never relies on a generic “Are you sure?” prompt.

## Information Architecture

```text
Build4Latam selector (/)
└── Venezuela community (/{locale})
    ├── Projects (/{locale}/projects)
    │   ├── Project detail (/{locale}/p/{slug})
    │   ├── Submit (/{locale}/submit)
    │   └── Edit (/{locale}/p/{slug}/edit)
    ├── Builders (/{locale}/builders)
    │   ├── Builder profile (future dedicated route)
    │   ├── Register/edit (/{locale}/builder/register)
    │   └── Contact requests (/{locale}/builder/requests)
    ├── Needs (/{locale}/requests)
    ├── Resources (/{locale}/recursos)
    ├── Impact (/{locale}/insights)
    └── Brand (/{locale}/brand; footer/secondary navigation)
```

### Header

Primary order:

`Projects / Builders / Needs / Resources / Impact`

Utilities:

`Search / Language / Theme / Create / Account`

The logo links to the localized Venezuela community home, not the country selector. A small Build4Latam switcher in the account/organization menu returns to `/`.

Social links and Brand move to the footer and mobile secondary group. Impact becomes a first-class destination once its data definitions and public framing are ready.

## Page Specifications

### Root Country Selector `/`

- Calm Build4Latam introduction with two country cards and a short explanation of the network.
- Preserve map/ASCII identity as a rare movement-layer moment.
- Cards show live counts and current activity, not only country names.
- Theme controls apply here too.

### Community Home `/{locale}`

1. Compact movement-layer hero: mission, universal search, `Explore projects`, `Contribute`.
2. Live proof strip: active projects, available builders, open needs, completed matches.
3. Featured projects with stage, current need, owner, location, one meaningful metric, freshness.
4. Urgent needs with effort, skill, deadline, and offer-help action.
5. Builder spotlight tied to actual contributions.
6. Impact snapshot with reporting period and methodology link.
7. Recent community activity.
8. Join/create editorial CTA.

No countdown or abstract campaign block should precede live inventory unless a time-bound event is actively running.

### Projects Directory

- Page header: title, concise description, project count, submit action.
- Search and filters: topic, stage, geography, need, recency, verification.
- URL-backed query and filter state; browser back restores state and scroll position.
- Desktop views: grid and table. Mobile views: visual cards and compact rows, not a forced `900px` table.
- Project card content: image/mark, stage, category, geography, title, one-sentence outcome, owner/team, current need, one metric, freshness.
- Sort by relevant, recently updated, most active, and greatest need. Votes may be visible but are not the default ranking signal.

### Project Detail

1. Cover/mark, title, stage, geography, owner, purpose statement.
2. Contextual primary action: visit, offer help, contribute, or contact.
3. Proof row: contributors, output/outcome, last update, verification.
4. Overview.
5. Current needs.
6. Team and contributing builders.
7. Progress updates and activity.
8. Impact evidence and source notes.
9. Resources and links.
10. Comments and related projects.

Desktop uses a sticky action/current-needs rail. Mobile uses a restrained sticky bottom action when one clear primary action exists.

### Builders Directory

- Search by role, skill, language, location/time zone, availability, and contribution history.
- Builder card: photo, name, concise role, location/time zone, languages, key skills, availability, projects contributed to, verified contribution count.
- Replace follower-style popularity with civic contribution signals.
- Add a dedicated profile route so cards can reveal portfolio, contributions, availability, and contact context before initiating a request.

### Needs Board

- Rename “Requests” to “Needs” in user-facing navigation while preserving the route initially.
- Need card: clear deliverable, requesting project, skills, effort, remote/local, deadline, urgency, status, offer-help action.
- Status: open, matching, matched, completed.
- Voting and comments remain supporting mechanisms, not the dominant visual hierarchy.
- Composer uses progressive disclosure and links the need to an owned project where possible.

### Resources

- Shared search grammar with entity-specific filters: format, language, topic, audience, source, last verified.
- Prefer compact rows over oversized cards for text-heavy links.
- Each resource shows why it is useful, provenance, language, freshness, and related projects/needs.

### Impact

- Publicly frame the current Insights data before adding it to primary navigation.
- Three levels: network headline, breakdown by topic/geography/time, project evidence.
- Controls: date range, topic, geography, chart/map/table.
- URL-backed explorer state and downloadable/shareable views.
- Every metric includes definition, period, source, freshness, and verification.
- Separate outputs from outcomes and security/maturity diagnostics from public impact.
- Mobile displays one visualization at a time; configuration moves into a bottom sheet.

### Forms And Account Workflows

- Submission, project editing, builder registration, and contact requests share one form grammar.
- Group long forms into meaningful sections with visible progress only when steps are independently valid.
- Autosave drafts where data loss would be costly.
- Owner/admin-only actions appear in a consistent entity action menu.
- Inbox rows prioritize sender, related project, request summary, status, and next action.

### Brand Page

- Remains a secondary destination for contributors and partners.
- Update it to document the dual-layer system, theme rules, typography, marks, asset downloads, and accessibility constraints.

## Responsive Behavior

| Pattern | Desktop | Mobile |
|---|---|---|
| Primary nav | Inline entity links | Full-height sheet |
| Search | Header trigger plus full command surface | Visible icon opens full-screen search |
| Filters | Inline common controls plus popover for more | Bottom sheet with sticky apply/reset |
| Project directory table | Sticky-header sortable table | Compact entity rows |
| Detail actions | Sticky right rail | Sticky bottom primary action when appropriate |
| Impact explorer | Visualization plus control rail | One visualization; controls in sheet |
| Cards | 2-3 column grids | Single column; compact variants available |

All hover-only information must be available through focus and touch. Test at `320px`, `375px`, `768px`, `1024px`, and `1440px`, with longest translations and realistic content.

## Accessibility And Content

- WCAG AA contrast for text and controls in both themes.
- Visible `:focus-visible` ring with sufficient offset.
- Minimum `44x44px` touch target for primary touch actions; compact desktop controls may use `32px` with adequate spacing.
- Statuses always combine text/icon with color.
- Charts include summaries, table alternatives, and keyboard-accessible controls.
- Skeletons match final geometry and do not pulse under reduced motion.
- Dates, numbers, and pluralization use locale-aware formatting.
- Use “Need” for a scoped community request and “Resource” for reusable material; do not collapse both into generic posts.

## Implementation Slices

Each slice ends in demoable user-facing UI.

| Slice | Scope | Demo |
|---|---|---|
| V1 | Semantic tokens, Geist Sans + Input Mono typography, theme bootstrapping, foundational controls, redesigned app header/footer | Navigate key current pages in complete light/dark themes without flash |
| V2 | Projects search/filter grammar, redesigned project cards, compact mobile rows, URL state | Browse and compare projects across desktop/mobile and share a filtered URL |
| V3 | Redesigned project detail with action rail, needs, team, updates/evidence modules using available data | Open a project and understand purpose, state, people, needs, and proof |
| V4 | Community homepage rebuilt from live projects/builders/needs/metrics | Reach real inventory and contribution actions within two viewports |
| V5 | Builders, Needs, and Resources migrated to shared discovery and entity patterns | Search each entity with consistent controls and entity-specific metadata |
| V6 | Impact explorer public framing, semantic charts, source notes, responsive controls | Filter, inspect, share, and understand an impact view in either theme |
| V7 | Forms, account workflows, inbox, comments, dialogs, empty/error/loading states | Complete authenticated workflows with the same system quality |
| V8 | Root selector, Brand page, editorial polish, cross-locale and accessibility QA | Experience the complete movement/product system across locales and themes |

## Acceptance

- All major public and authenticated surfaces use the same semantic tokens and component grammar.
- Light and dark modes pass contrast checks and preserve identical information hierarchy.
- Project filters are URL-backed and mobile never depends on horizontal scrolling for its primary comparison view.
- The homepage exposes live community inventory within two viewport heights.
- Project details visibly connect projects to builders, needs, updates, resources, and impact where data exists.
- Motion follows the specified frequency, purpose, timing, easing, reduced-motion, and touch rules.
- Six locales are tested with realistic long content and no clipped controls.
- Existing authorization and mutation behavior remains intact.
