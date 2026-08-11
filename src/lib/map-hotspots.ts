import type { SouthAmericaCountryCode } from "@/lib/south-america-map";

/** Matches `SOUTH_AMERICA_MAP.viewBox` width. */
export const MAP_VIEW_WIDTH = 560;

export type MapHotspot = {
  code: SouthAmericaCountryCode;
  /** Relative position inside the country bbox (0–1). */
  bx: number;
  by: number;
  /** Earthquake magnitude — drives hotspot radius. */
  magnitude: number;
};

/** Active emergency overlays for live hubs (VE / CO). */
export const MAP_HOTSPOTS: MapHotspot[] = [
  {
    code: "VE",
    bx: 0.48,
    by: 0.42,
    magnitude: 6.4,
  },
  {
    code: "CO",
    bx: 0.42,
    by: 0.55,
    magnitude: 7.4,
  },
];

/**
 * Radius in SVG units, proportional to map width.
 * M5 ≈ 5.5% of map width · M8 ≈ 14% of map width.
 */
export function hotspotRadius(magnitude: number) {
  const t = Math.min(1, Math.max(0, (magnitude - 5) / 3));
  return MAP_VIEW_WIDTH * (0.055 + t * 0.085);
}
