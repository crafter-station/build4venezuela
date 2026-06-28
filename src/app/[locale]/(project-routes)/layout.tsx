import type { ReactNode } from "react";

export default function ProjectRoutesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="bg-background pt-16 text-foreground">{children}</div>;
}
