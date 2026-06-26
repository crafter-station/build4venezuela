import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import messages from "../../../messages/en.json";

export default function ProjectRoutesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <div className="flex-1 pt-16">{children}</div>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
