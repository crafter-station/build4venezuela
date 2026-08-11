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
            aria-label={t("label")}
            className="uppercase"
            size="sm"
            variant="ghost"
          />
        }
      >
        <TranslateIcon data-icon="inline-start" />
        <span className="hidden sm:inline">{locale}</span>
        <CaretDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
          {routing.locales.map((option) => (
            <DropdownMenuItem
              className="cursor-pointer justify-between"
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
