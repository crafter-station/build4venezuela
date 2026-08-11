"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ListIcon, PlusIcon, UserCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CommandSearch } from "@/components/command-search";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Header");
  const homeHref = `/${locale}`;
  const navigationLinks = [
    { href: `/${locale}/projects`, label: t("links.projects") },
    { href: `/${locale}/builders`, label: t("links.builders") },
    { href: `/${locale}/requests`, label: t("links.requests") },
    { href: `/${locale}/recursos`, label: t("links.resources") },
    { href: `/${locale}/insights`, label: t("links.impact") },
  ];
  const createLinks = [
    { href: `/${locale}/submit`, label: t("create.project") },
    { href: `/${locale}/requests`, label: t("create.need") },
    { href: `/${locale}/recursos`, label: t("create.resource") },
    { href: `/${locale}/builder/register`, label: t("create.profile") },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-border/80 border-b bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-5 sm:px-8 lg:px-10">
        <Link
          aria-label={t("homeLabel")}
          className="ui-focus mr-auto inline-flex items-center font-mono text-lg font-black tracking-[-0.055em] sm:text-xl"
          href={homeHref}
        >
          Build4<span className="text-brand-yellow">Venezuela</span>
        </Link>

        <nav aria-label={t("navigationLabel")} className="hidden lg:block">
          <div className="flex items-center gap-1">
            {navigationLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "ghost" }),
                    "text-muted-foreground",
                    active && "bg-muted text-foreground",
                  )}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-1 hidden h-6 w-px bg-border lg:block" />

        <CommandSearch
          labels={{
            label: t("search"),
            description: t("searchDialog.description"),
            placeholder: t("searchDialog.placeholder"),
            loading: t("searchDialog.loading"),
            empty: t("searchDialog.empty"),
            error: t("searchDialog.error"),
            recent: t("searchDialog.recent"),
            projects: t("links.projects"),
            builders: t("links.builders"),
            needs: t("links.requests"),
          }}
          locale={locale}
        />

        <div className="hidden items-center gap-1 md:flex">
          <LanguageSelector />
          <ThemeToggle label={t("themeToggle")} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="hidden md:inline-flex"
                size="sm"
                type="button"
              />
            }
          >
            <PlusIcon data-icon="inline-start" />
            {t("create.label")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("create.label")}</DropdownMenuLabel>
              {createLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  render={<Link href={link.href} />}
                >
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Show when="signed-in">
          <div className="hidden size-10 items-center justify-center md:flex">
            <UserButton
              appearance={{ elements: { userButtonAvatarBox: "size-9" } }}
            />
          </div>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              aria-label={t("signIn")}
              className="hidden md:inline-flex"
              size="icon"
              title={t("signIn")}
              variant="outline"
            >
              <UserCircleIcon />
            </Button>
          </SignInButton>
        </Show>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                aria-label={t("menu")}
                className="md:hidden"
                size="icon"
                type="button"
                variant="ghost"
              />
            }
          >
            <ListIcon />
          </SheetTrigger>
          <SheetContent className="w-[min(90vw,24rem)] p-0" side="right">
            <SheetHeader className="border-b p-6 pr-14">
              <SheetTitle className="font-mono text-lg font-black tracking-[-0.04em]">
                Build4Venezuela
              </SheetTitle>
              <SheetDescription>{t("menuDescription")}</SheetDescription>
            </SheetHeader>

            <nav
              aria-label={t("navigationLabel")}
              className="flex flex-col gap-1 p-4"
            >
              <Link
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-auto justify-start py-3 text-base",
                )}
                href={homeHref}
              >
                {t("links.home")}
              </Link>
              {navigationLinks.map((link) => (
                <Link
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-auto justify-start py-3 text-base aria-[current=page]:bg-muted",
                  )}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mx-4 border-t p-4 px-0">
              <p className="mb-2 px-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t("create.label")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {createLinks.map((link) => (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-auto min-h-12 justify-start whitespace-normal p-3",
                    )}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t p-4">
              <LanguageSelector />
              <ThemeToggle label={t("themeToggle")} />
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button className="ml-auto" variant="outline">
                    {t("signIn")}
                  </Button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <div className="ml-auto">
                  <UserButton
                    appearance={{ elements: { userButtonAvatarBox: "size-9" } }}
                  />
                </div>
              </Show>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
