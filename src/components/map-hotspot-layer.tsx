"use client";

import {
  type CSSProperties,
  type MutableRefObject,
  useLayoutEffect,
  useState,
} from "react";
import { hotspotRadius, MAP_HOTSPOTS } from "@/lib/map-hotspots";
import type { SouthAmericaCountryCode } from "@/lib/south-america-map";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

type MapHotspotLayerProps = {
  active: SouthAmericaCountryCode | null;
  pathRefs: MutableRefObject<
    Partial<Record<SouthAmericaCountryCode, SVGPathElement>>
  >;
};

const RING_COUNT = 4;

export function MapHotspotLayer({ active, pathRefs }: MapHotspotLayerProps) {
  const [centers, setCenters] = useState<
    Partial<Record<SouthAmericaCountryCode, Point>>
  >({});

  useLayoutEffect(() => {
    const measure = () => {
      const next: Partial<Record<SouthAmericaCountryCode, Point>> = {};
      for (const hotspot of MAP_HOTSPOTS) {
        const path = pathRefs.current[hotspot.code];
        if (!path) continue;
        const box = path.getBBox();
        next[hotspot.code] = {
          x: box.x + box.width * hotspot.bx,
          y: box.y + box.height * hotspot.by,
        };
      }
      setCenters(next);
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [pathRefs]);

  return (
    <g className="sa-map__hotspots" pointerEvents="none">
      {MAP_HOTSPOTS.map((hotspot) => {
        const center = centers[hotspot.code];
        if (!center) return null;
        const isActive = active === hotspot.code;
        const isDimmed = Boolean(active && !isActive);
        const maxRadius = hotspotRadius(hotspot.magnitude);

        return (
          <g
            className={cn(
              "sa-map__quake",
              isActive && "sa-map__quake--active",
              isDimmed && "sa-map__quake--dimmed",
            )}
            key={hotspot.code}
          >
            {Array.from({ length: RING_COUNT }, (_, index) => {
              const step = (index + 1) / RING_COUNT;
              return (
                <circle
                  className="sa-map__quake-ring"
                  cx={center.x}
                  cy={center.y}
                  key={`${hotspot.code}-ring-${index}`}
                  r={maxRadius * step}
                  style={
                    {
                      "--quake-delay": `${index * 0.35}s`,
                      "--quake-opacity": String(0.85 - index * 0.16),
                    } as CSSProperties
                  }
                />
              );
            })}
            <circle
              className="sa-map__quake-core"
              cx={center.x}
              cy={center.y}
              r={Math.max(1.4, maxRadius * 0.045)}
            />
          </g>
        );
      })}
    </g>
  );
}
