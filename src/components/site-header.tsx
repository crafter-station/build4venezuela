"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { LanguageSelector } from "@/components/language-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 isolate z-40 border-border border-b bg-background/95 px-4 py-3 shadow-xl backdrop-blur sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                aria-label="Open Build4Venezuela menu"
                className="inline-flex cursor-pointer items-center transition hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                type="button"
              />
            }
          >
            <Image
              alt="Build4Venezuela"
              className="h-8 w-auto sm:h-9"
              height={285}
              priority
              src="/BFV/assets/B4V.svg"
              width={731}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-40 border-border bg-popover text-popover-foreground ring-border">
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer font-mono font-bold uppercase tracking-[0.16em] focus:bg-foreground focus:text-background"
                render={<a href="/">Home</a>}
              />
              <DropdownMenuItem
                className="cursor-pointer font-mono font-bold uppercase tracking-[0.16em] focus:bg-foreground focus:text-background"
                render={<a href="/brand">Brand</a>}
              />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="Main navigation">
            <div className="flex items-center gap-2">
              <Show when="signed-in">
                <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-right-1 duration-300">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-10 w-10",
                      },
                    }}
                  />
                </div>
              </Show>
              <a
                className="inline-flex h-10 items-center justify-center border border-border px-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:px-4"
                href="/projects"
              >
                Projects
              </a>
            </div>
          </nav>
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
