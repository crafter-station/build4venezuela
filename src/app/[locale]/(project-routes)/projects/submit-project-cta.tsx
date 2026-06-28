"use client";

import { ClerkLoading, Show, SignInButton } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";

const ctaClassName =
  "inline-flex border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-primary/80";

export function SubmitProjectCta() {
  const locale = useLocale();
  const t = useTranslations("Projects.submitCta");
  const submitHref = `/${locale}/submit`;

  return (
    <>
      <ClerkLoading>
        <button
          aria-label="Loading submit project action"
          className={`${ctaClassName} pointer-events-none opacity-60`}
          disabled
          type="button"
        >
          <span className="invisible">{t("label")}</span>
        </button>
      </ClerkLoading>
      <Show when="signed-in">
        <a className={ctaClassName} href={submitHref}>
          {t("label")}
        </a>
      </Show>
      <Show when="signed-out">
        <SignInButton
          forceRedirectUrl={submitHref}
          mode="modal"
          signUpForceRedirectUrl={submitHref}
        >
          <button className={ctaClassName} type="button">
            {t("label")}
          </button>
        </SignInButton>
      </Show>
    </>
  );
}
