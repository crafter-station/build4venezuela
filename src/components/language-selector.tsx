"use client";

import { CaretDownIcon, CheckIcon, TranslateIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routing } from "@/i18n/routing";

function getLocaleHref(pathname: string, locale: string) {
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0];

  if (
    routing.locales.includes(currentLocale as (typeof routing.locales)[number])
  ) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${locale}/${rest}` : `/${locale}`;
  }

  return `/${locale}`;
}

export function LanguageSelector() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Header.languageSelector");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="h-10 border-border bg-foreground px-3 py-0 text-background hover:bg-primary hover:text-primary-foreground aria-expanded:bg-primary aria-expanded:text-primary-foreground sm:px-4"
            variant="outline"
            size="sm"
            aria-label={t("label")}
          />
        }
      >
        <TranslateIcon data-icon="inline-start" />
        <CaretDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-36 border-border bg-popover text-popover-foreground ring-border"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-mono text-muted-foreground">
            {t("label")}
          </DropdownMenuLabel>
          {routing.locales.map((option) => (
            <DropdownMenuItem
              className="cursor-pointer justify-between font-mono text-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground [&_svg]:text-primary focus:[&_svg]:text-primary-foreground"
              key={option}
              render={
                <a href={getLocaleHref(pathname, option)}>
                  <span>{t(`locales.${option}`)}</span>
                  {option === locale ? <CheckIcon /> : null}
                </a>
              }
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
