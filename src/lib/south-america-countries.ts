import type { SouthAmericaCountryCode } from "@/lib/south-america-map";

export type SouthAmericaCountryContent = {
  disaster: string;
  name: string;
  tags: string[];
};

export type SouthAmericaCountriesContent = Record<
  SouthAmericaCountryCode,
  SouthAmericaCountryContent
>;

export const SOUTH_AMERICA_COUNTRY_CODES = [
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "EC",
  "GY",
  "PE",
  "PY",
  "SR",
  "UY",
  "VE",
] as const satisfies readonly SouthAmericaCountryCode[];
