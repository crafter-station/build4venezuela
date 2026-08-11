import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "zh", "ja", "fr", "pt"],
  defaultLocale: "en",
  localeDetection: true,
});
