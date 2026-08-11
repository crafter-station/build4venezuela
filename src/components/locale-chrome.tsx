"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
  const isCountrySelector = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname === `/${locale}/`,
  );

  if (isCountrySelector) {
    return children;
  }

  return (
    <div className="flex min-h-full flex-col">
      {header}
      <div className="flex-1">{children}</div>
      {footer}
    </div>
  );
}
