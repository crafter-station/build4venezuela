# Visual Style Reference — Map Hover Panel (Right Rail)

How country info should look on the **right** when hovering / selecting a country.  
Accent stays Build4Latam yellow (`#ffd83d`), not the reference red.

Related: [`visual-style-reference-hud.md`](./visual-style-reference-hud.md) (overall map field).

---

## 1. Core Aesthetic

- **Style name:** **Target Briefing Panel**
- **Design philosophy:** The right rail is an intel brief locked to a point on the map — technical, monospace, framed by thin geometry, not a marketing card.
- **Key influences:** cyber ops / surveillance dashboard · wireframe globe UIs · “Target Operation” callouts with elbow leaders · Build4 mono poster type

---

## 2. Color Palette

**Total: 5 colors**

| Color name | Hex | Usage |
|---|---|---|
| Void black | `#0a0a0a` – `#10100f` | Panel field / page behind text |
| Wire gray | `#3a3a38` – `#5c5c56` | Thin panel rules, elbow line (idle segments), micro-boxes |
| Signal white | `#f4f3ee` | Body / description monospace text |
| Muted ash | `#8a8780` | Meta lines, secondary labels, tags |
| Brand yellow | `#ffd83d` | Country title, leader-line tip, active markers, CTA fill |

**Rules**
- Title = yellow only (like “USA” / “BRAZIL” in the reference).
- Body = white/off-white mono, never yellow paragraphs.
- No filled white cards; no soft shadows under the whole block.
- Tags as hairline outline chips, not pills with heavy fill.

---

## 3. Typography System

- **Headline (country name):** Input Mono Narrow · Bold / Black · uppercase preferred · bright yellow · larger than body but not display-poster scale on this rail
- **Body / disaster copy:** Input Mono Narrow · Regular / Light · smaller · left-aligned · comfortable line length (~28–40ch) · light gray/white
- **Meta / tags:** Mono · XS · uppercase · wide tracking · muted ash · hairline borders
- **Hierarchy**
  1. Country name (yellow)
  2. Optional micro-label (`TARGET` / `/{code}` / status) in ash
  3. Description block (white)
  4. Tag row + Submit / Explore
- **Special considerations**
  - Entire panel reads as one “operation brief,” not a blog excerpt
  - Keep bilingual strings short so the block stays dense and technical

---

## 4. Key Design Elements

### Textures and treatments
- Flat dark field; optional faint grid bleeding from the page (already on home)
- No glassmorphism, no large rounded cards

### Graphic elements
- **Elbow leader:** thin line from map point → horizontal run → into the text block (not a single soft diagonal)
- **Anchor point:** small yellow/white dot or crosshair on the country
- **Optional micro-frame:** 1px gray L-corners or a partial box around the brief (reference “module” feel) — keep light; do not wrap everything in a heavy rectangle
- **No mini regional maps** required for v1 (reference has them; skip unless we add later)

### Layout structure
- Right column = briefing stack, vertically centered or top-aligned to the leader end
- Content order:
  1. Yellow country title  
  2. Short disaster / status paragraph  
  3. Project-type tags  
  4. Primary CTA row (Submit; Explore for VE/CO)
- Generous gap from the map; the **line** is the bridge, not a shared card edge

### Unique stylistic choices
- Feels like a **locked target dossier**, not a tooltip or shadcn Card
- Yellow is reserved for the name + active geometry; body stays cool white/gray
- Timing: line draws first → brief fades/slides in (already partially implemented)

---

## 5. Visual Concept

- **Bridge:** Reference callouts explain a region on a wireframe globe; our rail explains a Latam country after hover — same “point → elbow → brief” grammar, solidarity yellow instead of ops red.
- **Relationship:** Map point = sensor · elbow line = attention tether · yellow title = lock · white body = intel · CTA = action
- **Ideal use cases:** Home map hover/select panel; later “active emergency” briefs for VE/CO

### Implementation checklist (right rail)

**Do**
- Yellow uppercase country name
- Mono white description under it
- Elbow leader into the block
- Thin/outline tags; yellow or outline CTAs
- Remount/animate brief when country changes

**Don’t**
- Big bordered marketing card
- Colored body text
- Soft drop-shadow panels
- Dense charts / activity grids from the reference (out of scope for this rail)

---

*Source: surveillance/globe dashboard reference (target callouts) + Build4Latam yellow `#ffd83d`.*
