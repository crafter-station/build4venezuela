# Visual Style Reference — Build4Latam Map HUD

Adaptation of the reference HUD aesthetic, keeping Build4Latam yellow as the sole accent.

---

## 1. Core Aesthetic

- **Style name:** **Crisis Cartography HUD**
- **Design philosophy:** Treat the map like a live emergency console — sparse, precise, high-contrast — where yellow marks the only active signal.
- **Key influences:** tactical / search-and-rescue HUD · dark cartographic UI · Build4 poster mono urgency · soft “active search” glow (yellow instead of alert red)

---

## 2. Color Palette

**Total: 6 colors** (tight, intentional)

| Color name | Hex | Usage |
|---|---|---|
| Void black | `#0a0a0a` | Page / map field background (deeper than current `#10100f` when pushing the HUD look) |
| Surface charcoal | `#121212` – `#171716` | Header/footer strips, subtle panels |
| Signal white | `#f4f3ee` / `#ffffff` | Country outlines at rest, primary labels, thin connector geometry |
| Muted ash | `#8a8780` – `#6b6860` | Secondary metadata, hints, inactive copy |
| Brand yellow | `#ffd83d` | Hover / selected country, leader line, glow, CTAs, active dots |
| Ink on yellow | `#10100f` / `#000000` | Text on yellow buttons only |

**Rules**
- No red, blue, or purple accents on the map surface.
- Yellow = only “live” / selected signal.
- White = structure (coasts, idle borders, hairlines).
- Never flood-fill countries with solid yellow; prefer low-opacity yellow wash + bright yellow stroke + soft glow.

---

## 3. Typography System

- **Headline:** Input Mono Narrow (existing brand mono) · Black / Bold · large but not poster-shouting · tight tracking · uppercase optional for country name
- **Body / secondary:** Same mono family · smaller scale · uppercase · wide tracking (`0.08em`–`0.2em`) for disaster blurb and tags — reads as telemetry, not blog copy
- **Hierarchy**
  1. Country name (primary)
  2. Eyebrow code (`/ve`)
  3. Disaster line (muted)
  4. Tags + CTAs (smallest / utility)
- **Special considerations**
  - Stay bilingual-ready; keep labels short
  - Prefer mono over sans for map chrome (matches BFV; the reference’s Inter-like sans is *not* the brand default — translate the *feel* into Input Mono)

---

## 4. Key Design Elements

### Textures and treatments
- Near-black matte field
- Optional **fine film grain / noise** (very low opacity) over the map plane
- Soft **radial yellow glow** under selected/hovered country (not neon bloom everywhere)

### Graphic elements
- **Hairline outlines** (~1–1.25px) for idle countries in white / off-white
- **Active stroke** in yellow with subtle drop-shadow / glow
- **Leader line:** thin yellow path that *draws* from country → content (elbow ok); start with a small crosshair or dot
- Minimal glyphs only if needed: crosshair, pin, small status tick — no heavy icons, no warning triangles unless a real alert state exists

### Layout structure
- Sparse HUD: map dominates left; content floats right with **air**, not a card
- Push metadata to the content column; keep map plane clean
- Header stays slim; footer stays one hairline row of logos
- Negative space is part of the design — do not pack stats into the first viewport

### Unique stylistic choices
- **Tension:** emergency-console precision × solidarity brand yellow (hope signal, not siren red)
- Selection feels like an “active search” lock, not a marketing hover
- Content appears *after* the line draws (timing already started: line ~480ms → panel fade)

---

## 5. Visual Concept

- **Bridge:** The reference image is a coastal search HUD; Build4Latam is a continental solidarity network. Same language (dark field, thin vectors, one hot accent), different mission color — yellow = “we’re building here.”
- **Relationship between elements:** Map = sensor field · yellow = locked target · right rail = briefing · line = attention path from land to action (Submit / Explore)
- **Ideal use cases:** Latam home map, country selection, future “active emergency” states for VE/CO without leaving the dark console frame

### Do / Don’t (for implementation)

**Do**
- Idle strokes ≈ white/ash; active = `#ffd83d` + soft glow
- Thin leader lines; animate draw on hover
- Keep panel frameless (no big bordered box)

**Don’t**
- Atlas-style multicolor fills
- Red/orange “alert” palette from the reference
- Dense dashboard chrome (stats grids, chips stacks) on the first viewport
- Soft purple/glow UI clichés unrelated to this HUD

---

*Source: user visual reference (coastal HUD) + Build4Latam brand yellow `#ffd83d`.*
