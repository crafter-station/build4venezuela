"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HudCapsule } from "@/components/hud-capsule";
import { LandingSplash } from "@/components/landing-splash";
import { routing } from "@/i18n/routing";

export function LocaleChrome({
  children,
  footer,
  header,
}: {
  children: ReactNode;
  footer: ReactNode;
  header: ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname === `/${locale}/`,
  );

  if (isLanding) {
    return (
      <div className="landing-type flex min-h-full flex-col bg-background">
        <LandingSplash />
        <div className="relative flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-5">
          <div
            aria-hidden="true"
            className="bg-grid absolute inset-0 opacity-[0.05]"
          />
          <HudCapsule className="flex min-h-[calc(100svh-8.5rem)] flex-1 flex-col">
            {header}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </HudCapsule>
          <HudCapsule className="shrink-0">{footer}</HudCapsule>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {header}
      <div className="flex-1">{children}</div>
      {footer}
    </div>
  );
}
