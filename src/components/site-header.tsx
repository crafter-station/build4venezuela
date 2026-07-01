"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { CaretDownIcon, ListIcon, UsersThreeIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const locale = useLocale();
  const t = useTranslations("Header");
  const navigationLinks = [
    { href: `/${locale}`, label: t("links.home") },
    { href: `/${locale}/brand`, label: t("links.brand") },
    { href: "/whatsapp", label: t("links.whatsapp") },
    { href: "/discord", label: t("links.discord") },
    { href: `/${locale}/projects`, label: t("links.projects") },
    { href: `/${locale}/builders`, label: t("links.builders") },
    { href: `/${locale}/requests`, label: t("links.requests") },
    { href: `/${locale}/recursos`, label: t("links.resources") },
  ];
  const desktopNavigationLinks = navigationLinks.filter(
    (link) => link.href !== "/whatsapp" && link.href !== "/discord",
  );
  const socialLinks = navigationLinks.filter(
    (link) => link.href === "/whatsapp" || link.href === "/discord",
  );

  return (
    <header className="fixed inset-x-0 top-0 isolate z-40 border-border border-b bg-background/95 px-4 py-3 shadow-xl backdrop-blur sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <a
          aria-label="Build4Venezuela home"
          className="inline-flex items-center transition hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          href={`/${locale}`}
        >
          <Image
            alt="Build4Venezuela"
            className="h-8 w-auto sm:h-9"
            height={285}
            priority
            src="/BFV/assets/B4V.svg"
            width={731}
          />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label={t("navigationLabel")} className="hidden md:block">
            <div className="flex items-center gap-2">
              <Show when="signed-in">
                <div className="flex h-10 items-center justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-right-1 duration-300">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-10 w-10",
                      },
                    }}
                  />
                </div>
              </Show>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      aria-label="Open community links"
                      className="h-10 border-border bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-foreground hover:border-foreground hover:bg-foreground hover:text-background aria-expanded:border-foreground aria-expanded:bg-foreground aria-expanded:text-background lg:px-4"
                      size="sm"
                      variant="outline"
                    />
                  }
                >
                  <UsersThreeIcon className="ml-1" data-icon="inline-start" />
                  <span>{t("links.socials")}</span>
                  <CaretDownIcon data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-44 border-border bg-popover text-popover-foreground ring-border"
                >
                  <DropdownMenuGroup>
                    {socialLinks.map((socialLink) => (
                      <DropdownMenuItem
                        className="cursor-pointer font-mono font-bold uppercase tracking-[0.16em] text-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                        key={socialLink.href}
                        render={
                          <a href={socialLink.href}>{socialLink.label}</a>
                        }
                      />
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {desktopNavigationLinks.slice(2).map((link) => (
                <a
                  className="inline-flex h-10 items-center justify-center border border-border px-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:px-4"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
          <LanguageSelector />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="Open Build4Venezuela menu"
                  className="h-10 border-border bg-background px-3 text-foreground hover:bg-foreground hover:text-background aria-expanded:bg-foreground aria-expanded:text-background md:hidden"
                  size="sm"
                  variant="outline"
                />
              }
            >
              <ListIcon data-icon="inline-start" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-56 border-border bg-popover text-popover-foreground ring-border md:hidden"
            >
              <DropdownMenuGroup>
                {navigationLinks.map((link) => (
                  <DropdownMenuItem
                    className="cursor-pointer font-mono font-bold uppercase tracking-[0.16em] text-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                    key={link.href}
                    render={<a href={link.href}>{link.label}</a>}
                  />
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
