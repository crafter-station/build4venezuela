"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TIER_COLOR } from "@/lib/insights/constants";
import type { InsightEdge, InsightNode } from "@/lib/insights/types";

type Props = {
  nodes: InsightNode[];
  edges: InsightEdge[];
  activeSlugs: Set<string>;
  hover: string | null;
  onHover: (s: string | null) => void;
  onSelect: (s: string) => void;
};

const MIN_K = 0.6;
const MAX_K = 8;
const VB = 1000;

export function OverlapNetwork({
  nodes,
  edges,
  activeSlugs,
  hover,
  onHover,
  onSelect,
}: Props) {
  const pos = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.slug, n])),
    [nodes],
  );

  // neighbors of the hovered node (for highlight)
  const neighbors = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    for (const e of edges) {
      if (e.source === hover) set.add(e.target);
      if (e.target === hover) set.add(e.source);
    }
    return set;
  }, [hover, edges]);

  const radius = (n: InsightNode) => 5 + n.scores.viability * 1.8;

  // --- pan / zoom ---
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef({ active: false, sx: 0, sy: 0 });
  const movedRef = useRef(false);
  const [grabbing, setGrabbing] = useState(false);

  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * VB,
      y: ((clientY - rect.top) / rect.height) * VB,
    };
  };

  const zoomTo = (k: number, px: number, py: number) => {
    const v = viewRef.current;
    const clamped = Math.min(MAX_K, Math.max(MIN_K, k));
    const wx = (px - v.x) / v.k;
    const wy = (py - v.y) / v.k;
    setView({ k: clamped, x: px - wx * clamped, y: py - wy * clamped });
  };

  // wheel zoom toward cursor (native listener so we can preventDefault)
  // biome-ignore lint/correctness/useExhaustiveDependencies: attach once; handler reads latest view via viewRef
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const { x, y } = toSvg(ev.clientX, ev.clientY);
      zoomTo(viewRef.current.k * Math.exp(-ev.deltaY * 0.0015), x, y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY };
    movedRef.current = false;
    setGrabbing(true);
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current.active) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxPx = e.clientX - drag.current.sx;
    const dyPx = e.clientY - drag.current.sy;
    if (Math.abs(dxPx) + Math.abs(dyPx) > 4) movedRef.current = true;
    drag.current.sx = e.clientX;
    drag.current.sy = e.clientY;
    setView((v) => ({
      ...v,
      x: v.x + (dxPx / rect.width) * VB,
      y: v.y + (dyPx / rect.height) * VB,
    }));
  };
  const endPan = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current.active = false;
    setGrabbing(false);
    svgRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const select = (slug: string) => {
    if (movedRef.current) return; // ignore click that ended a pan
    onSelect(slug);
  };

  return (
    <div className="relative">
      {/* zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <ZoomBtn
          label="+"
          onClick={() => zoomTo(viewRef.current.k * 1.3, 500, 500)}
        />
        <ZoomBtn
          label="−"
          onClick={() => zoomTo(viewRef.current.k / 1.3, 500, 500)}
        />
        <ZoomBtn label="⤢" onClick={() => setView({ k: 1, x: 0, y: 0 })} />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 font-mono text-[10px] text-muted-foreground">
        scroll to zoom · drag to pan
        {view.k !== 1 && ` · ${view.k.toFixed(1)}×`}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="h-[360px] w-full touch-none select-none"
        style={{ cursor: grabbing ? "grabbing" : "grab" }}
        role="img"
        aria-label="Project overlap network"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <title>Project overlap network</title>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* edges */}
          {edges.map((e) => {
            const a = pos[e.source];
            const b = pos[e.target];
            if (!a || !b) return null;
            const touchesHover =
              neighbors && (e.source === hover || e.target === hover);
            const bothActive =
              activeSlugs.has(e.source) && activeSlugs.has(e.target);
            const op = touchesHover
              ? 0.9
              : neighbors
                ? 0.04
                : bothActive
                  ? 0.06 + e.weight * 0.04
                  : 0.02;
            return (
              <line
                key={`${e.source}-${e.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={touchesHover ? "#16c7e8" : "#ffffff"}
                strokeOpacity={op}
                strokeWidth={
                  (touchesHover ? 1 + e.weight * 0.5 : e.weight * 0.5) / view.k
                }
              />
            );
          })}
          {/* nodes */}
          {nodes.map((n) => {
            const dim = !activeSlugs.has(n.slug);
            const faded = neighbors ? !neighbors.has(n.slug) : false;
            const hot = hover === n.slug;
            const r = radius(n);
            return (
              // biome-ignore lint/a11y/useSemanticElements: interactive SVG <g> node — a DOM <button> cannot be used inside an <svg>
              <g
                key={n.slug}
                transform={`translate(${n.x},${n.y})`}
                style={{ cursor: "pointer" }}
                opacity={dim ? 0.18 : faded ? 0.28 : 1}
                role="button"
                tabIndex={0}
                aria-label={`${n.name} — ${n.tier}`}
                onMouseEnter={() => onHover(n.slug)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(n.slug)}
                onBlur={() => onHover(null)}
                onClick={() => select(n.slug)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(n.slug);
                  }
                }}
              >
                <circle
                  r={r}
                  fill={TIER_COLOR[n.tier]}
                  fillOpacity={hot ? 1 : 0.82}
                  stroke={hot ? "#fff" : "#000"}
                  strokeWidth={(hot ? 2 : 1) / view.k}
                />
                {(hot || r > 11) && (
                  <text
                    x={r + 3}
                    y={3}
                    fill="#fff"
                    fontSize={(hot ? 15 : 12) / view.k}
                    fontFamily="monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.slug}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function ZoomBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center border border-border bg-card font-mono text-sm text-foreground hover:border-foreground"
    >
      {label}
    </button>
  );
}
