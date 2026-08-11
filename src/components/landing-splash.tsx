"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "bfv-landing-splash-v5";
const LOAD_MS = 3200;
const LEAVE_MS = 480;

const PHASES = [
  {
    id: "co",
    label: "Colombia",
    analyze: "Problem in Colombia",
    action: "Look for help",
    to: 52,
  },
  {
    id: "ve",
    label: "Venezuela",
    analyze: "Problem in Venezuela",
    action: "Look for help",
    to: 100,
  },
] as const;

function markSeen() {
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    // ignore
  }
}

function useLoadProgress(active: boolean, duration: number) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic — fills fast, settles at 100
      const eased = 1 - (1 - t) ** 3;
      setProgress(Math.round(eased * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration]);

  return progress;
}

function SideGlyph({ side }: { side: "left" | "right" }) {
  return (
    <div aria-hidden="true" className={cn("landing-boot__glyph", side)}>
      <span className="landing-boot__tick" />
      <span className="landing-boot__plus">+</span>
      <span className="landing-boot__dot" />
    </div>
  );
}

export function LandingSplash() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(SPLASH_KEY) === "1") return;
    } catch {
      // sessionStorage may be unavailable
    }
    setVisible(true);
  }, []);

  const progress = useLoadProgress(visible && !leaving, LOAD_MS);
  const phase =
    PHASES.find((item) => progress < item.to) ?? PHASES[PHASES.length - 1];

  useEffect(() => {
    if (!visible || leaving) return;
    if (progress < 100) return;

    const leave = window.setTimeout(() => setLeaving(true), 280);
    return () => window.clearTimeout(leave);
  }, [visible, leaving, progress]);

  useEffect(() => {
    if (!leaving) return;
    const hide = window.setTimeout(() => {
      markSeen();
      setVisible(false);
    }, LEAVE_MS);
    return () => window.clearTimeout(hide);
  }, [leaving]);

  function dismiss() {
    setLeaving(true);
  }

  if (!mounted || !visible) return null;

  const fill = Math.min(100, Math.max(0, progress));
  // Visual gap near the end like the reference
  const mainWidth = fill >= 96 ? 88 : Math.max(4, fill * 0.92);
  const tipWidth = fill >= 96 ? Math.min(8, fill - 92) : 0;

  return (
    <div className={cn("landing-boot", leaving && "landing-boot--leave")}>
      <button className="landing-boot__skip" onClick={dismiss} type="button">
        Skip
      </button>

      <output className="landing-boot__stage" aria-live="polite">
        <div className="landing-boot__top">
          <p className="landing-boot__loading-label">Loading</p>
          <div className="landing-boot__pct-wrap">
            <span aria-hidden="true" className="landing-boot__pct-corner tl" />
            <span aria-hidden="true" className="landing-boot__pct-corner tr" />
            <span aria-hidden="true" className="landing-boot__pct-corner bl" />
            <span aria-hidden="true" className="landing-boot__pct-corner br" />
            <p className="landing-boot__pct">{fill}</p>
          </div>
          <p className="landing-boot__meta" aria-hidden="true">
            04 11 — {phase.label === "Colombia" ? "CO" : "VE"} 01
          </p>
        </div>

        <div className="landing-boot__bar-row">
          <SideGlyph side="left" />
          <div className="landing-boot__bar">
            <span
              className="landing-boot__bar-fill"
              style={{ width: `${mainWidth}%` }}
            />
            {tipWidth > 0 ? (
              <span
                className="landing-boot__bar-tip"
                style={{ width: `${tipWidth}%` }}
              />
            ) : null}
          </div>
          <SideGlyph side="right" />
        </div>

        <div className="landing-boot__bottom">
          <p className="landing-boot__analyze">{phase.analyze}</p>
          <span aria-hidden="true" className="landing-boot__analyze-line" />
          <p className="landing-boot__action">{phase.action}</p>
        </div>
      </output>
    </div>
  );
}
