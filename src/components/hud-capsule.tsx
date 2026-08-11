import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HudCapsule({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hud-capsule relative z-10", className)}>
      <span className="hud-capsule__corner hud-capsule__corner--tl" />
      <span className="hud-capsule__corner hud-capsule__corner--tr" />
      <span className="hud-capsule__corner hud-capsule__corner--bl" />
      <span className="hud-capsule__corner hud-capsule__corner--br" />
      {children}
    </div>
  );
}
