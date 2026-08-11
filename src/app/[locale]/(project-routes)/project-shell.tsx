import type { ReactNode } from "react";

export function ProjectShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen min-w-0 bg-background text-foreground">
      {children}
    </main>
  );
}
