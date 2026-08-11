"use client";

import { track } from "@vercel/analytics";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type SponsorLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  sponsor: string;
  placement: string;
};

export function SponsorLink({
  children,
  href,
  onClick,
  placement,
  sponsor,
  ...props
}: SponsorLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        track("Sponsor Link Clicked", {
          href: href ?? "",
          placement,
          sponsor,
        });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
