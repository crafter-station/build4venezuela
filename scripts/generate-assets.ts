/**
 * Brand asset generator — OG images + favicon.
 *
 * Derives everything from existing brand elements:
 *   - public/BFV/assets/B4V.svg  (full wordmark, brand colors)
 *   - public/BFV/assets/v-mark.svg  (the "V" glyph, used for the favicon)
 *   - design tokens from src/app/globals.css (black bg, yellow, cyan)
 *
 * Outputs (idempotent — safe to re-run):
 *   - public/og.png          1200x630  (Open Graph)
 *   - public/og-twitter.png  1200x600  (Twitter / X)
 *   - public/favicon.ico     16/32/48  (multi-size ICO)
 *   - src/app/favicon.ico    (same bytes — this is the one Next.js serves)
 *
 * Run: bun scripts/generate-assets.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// --- Point fontconfig at the bundled Input Mono Narrow before sharp loads, so
// --- the poster typography matches the live site. Falls back to system mono.
const ROOT = join(import.meta.dir, "..");
const FONT_DIR = join(ROOT, "public/BFV/fonts");
const FC_DIR = join(ROOT, ".data/fc-cache");
const FC_FILE = join(ROOT, ".data/fonts.conf");
mkdirSync(FC_DIR, { recursive: true });
writeFileSync(
  FC_FILE,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>${FC_DIR}</cachedir>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <include ignore_missing="yes">/usr/local/etc/fonts/fonts.conf</include>
  <include ignore_missing="yes">/opt/homebrew/etc/fonts/fonts.conf</include>
</fontconfig>
`,
);
process.env.FONTCONFIG_FILE = FC_FILE;

const sharp = (await import("sharp")).default;

// --- Brand tokens (mirrors src/app/globals.css) -----------------------------
const COLOR = {
  bg: "#000000",
  fg: "#ffffff",
  primary: "#ffd83d", // brand yellow
  accent: "#16c7e8", // brand cyan
  muted: "#a6a6a6",
  border: "#3a3a3a",
};
const FONT = "Input Mono Narrow, InputMonoNarrow, ui-monospace, monospace";

const PUBLIC = join(ROOT, "public");
const WORDMARK = join(PUBLIC, "BFV/assets/B4V.svg");
const VMARK = join(PUBLIC, "BFV/assets/v-mark.svg");
const TAGLINE = "Build projects for Venezuelans.";
const EYEBROW = "BUILD4VENEZUELA";

/** A faint grid + thin frame echoing the site's poster texture. */
function texture(w: number, h: number): string {
  const step = 60;
  const lines: string[] = [];
  for (let x = step; x < w; x += step) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" />`);
  }
  for (let y = step; y < h; y += step) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" />`);
  }
  return `
    <g stroke="${COLOR.fg}" stroke-opacity="0.035" stroke-width="1">
      ${lines.join("")}
    </g>
    <rect x="24.5" y="24.5" width="${w - 49}" height="${h - 49}"
      fill="none" stroke="${COLOR.border}" stroke-width="1" />`;
}

/**
 * Background canvas (everything except the rasterized wordmark, which is
 * composited on top so its brand colors render crisply via librsvg).
 */
function canvas(w: number, h: number, markTop: number, markH: number): string {
  const centerX = w / 2;
  const tagY = markTop + markH + 96;
  const ruleY = markTop + markH + 52;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${COLOR.bg}" />
    ${texture(w, h)}
    <text x="${centerX}" y="84" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="20"
      letter-spacing="10" fill="${COLOR.accent}">${EYEBROW}</text>
    <rect x="${centerX - 36}" y="${ruleY}" width="72" height="3" fill="${COLOR.primary}" />
    <text x="${centerX}" y="${tagY}" text-anchor="middle"
      font-family="${FONT}" font-weight="500" font-size="30"
      letter-spacing="2" fill="${COLOR.fg}">${TAGLINE}</text>
  </svg>`;
}

/** Recolor the V-mark to brand yellow and seat it on a rounded black tile. */
function faviconSvg(size: number): string {
  const raw = readFileSync(VMARK, "utf8");
  // Strip the outer <svg> wrapper + xml decl; keep inner geometry, recolored.
  const inner = raw
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>/, "")
    .replace(/fill:\s*#333/gi, `fill:${COLOR.primary}`);
  const pad = size * 0.24;
  const inner_w = size - pad * 2;
  const scale = inner_w / 44.67; // v-mark viewBox width
  const ty = (size - 45.6 * scale) / 2;
  const r = size * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${COLOR.bg}" />
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${r - 2}" ry="${r - 2}"
      fill="none" stroke="${COLOR.primary}" stroke-opacity="0.5" stroke-width="${Math.max(1, size * 0.02)}" />
    <g transform="translate(${pad}, ${ty}) scale(${scale})">${inner}</g>
  </svg>`;
}

/** Minimal ICO encoder — embeds PNG entries (supported since Vista). */
function buildIco(entries: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  const blobs: Buffer[] = [];
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o); // width
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // color planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.png.length, o + 8); // size of data
    dir.writeUInt32LE(offset, o + 12); // offset
    offset += e.png.length;
    blobs.push(e.png);
  });
  return Buffer.concat([header, dir, ...blobs]);
}

async function makeOg(w: number, h: number, out: string): Promise<void> {
  // Wordmark aspect from B4V.svg viewBox: 731.08 x 284.65.
  const markW = Math.round(w * 0.46);
  const markH = Math.round(markW * (284.65 / 731.08));
  const markTop = Math.round(h * 0.26);

  const mark = await sharp(WORDMARK, { density: 384 })
    .resize(markW, markH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(Buffer.from(canvas(w, h, markTop, markH)))
    .composite([
      { input: mark, top: markTop, left: Math.round((w - markW) / 2) },
    ])
    .png()
    .toFile(out);
  console.log(`✓ ${out.replace(`${ROOT}/`, "")}  (${w}×${h})`);
}

async function makeFavicon(): Promise<void> {
  const sizes = [16, 32, 48];
  const entries = await Promise.all(
    sizes.map(async (size) => ({
      size,
      png: await sharp(Buffer.from(faviconSvg(size)), { density: 384 })
        .resize(size, size)
        .png()
        .toBuffer(),
    })),
  );
  const ico = buildIco(entries);
  for (const dest of [
    join(PUBLIC, "favicon.ico"),
    join(ROOT, "src/app/favicon.ico"),
  ]) {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, ico);
    console.log(`✓ ${dest.replace(`${ROOT}/`, "")}  (${sizes.join("/")})`);
  }
}

await makeOg(1200, 630, join(PUBLIC, "og.png"));
await makeOg(1200, 600, join(PUBLIC, "og-twitter.png"));
await makeFavicon();
console.log("\nBrand assets generated.");
